# main.py
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from analyzer import CombinedAnalyzer
from analyzer.codebert_analyzer import SnippetInfo, SequentialSimilarity
from analyzer.codebert_attention import CodeBERTAttentionAnalyzer
from analyzer.attention import (
    CodeSimilarityAnalyzer as OriginalCodeSimilarityAnalyzer,
)  # Renamed to avoid conflict
from analyzer.agreement_analyzer import AgreementAnalyzer  # Fixed import path

import json
import logging
import traceback
from pymongo import MongoClient
from bson import ObjectId
import time


app = Flask(__name__)
CORS(app)

# Initialize the combined analyzer
codebert_detector = CombinedAnalyzer()

# Connect to MongoDB
client = MongoClient("mongodb://127.0.0.1:27017/codec-v3")
db = client["codec-v3"]
userSubmissionsCollection = db["usersubmissions"]
snapshotsCollection = db["codesnapshots"]


@app.route("/api/similarity/matrix", methods=["GET"])
# @limiter.limit("10 per minute")
def get_similarity_matrix():
    print("Similarity matrix request received.")
    start_time = time.time()
    try:
        problem_id = request.args.get("problemId")
        room_id = request.args.get("roomId")
        verdict = request.args.get("verdict")
        user_type = request.args.get("userType")
        accept_partial_submissions = (
            request.args.get("acceptPartialSubmissions") == "true"
        )
        highest_scoring_only = request.args.get("highestScoringOnly") == "true"

        if not problem_id and not room_id:
            return (
                jsonify(
                    {"success": False, "message": "No problemId or roomId provided"}
                ),
                400,
            )

        query = {}

        # Only apply verdict filter if a specific verdict is provided
        if verdict:  # If a specific verdict is provided (not empty string)
            query["verdict"] = verdict
        # Don't set a default verdict when "All" is selected (empty string)

        # If accept_partial_submissions is enabled, add score filter
        if accept_partial_submissions:
            query["score"] = {"$gt": 0}

        if problem_id:
            query["problem"] = problem_id

        if room_id:
            query["room"] = room_id

        if user_type and user_type != "All":
            query["user_type"] = user_type

        print("query:", query)

        aggregation_pipeline = [{"$match": query}]

        # Apply highest-scoring filter per learner if enabled
        if highest_scoring_only:
            aggregation_pipeline += [
                {"$sort": {"score": -1}},  # Sort by score descending
                {"$group": {"_id": "$learner_id", "doc": {"$first": "$$ROOT"}}},
                {"$replaceRoot": {"newRoot": "$doc"}},
            ]

        submissions = list(userSubmissionsCollection.aggregate(aggregation_pipeline))

        for submission in submissions:
            submission["_id"] = str(submission["_id"])
            submission["learner_id"] = str(submission["learner_id"])

        # logger.info(f"Found {len(submissions)} submissions matching the query")

        snippets = [
            SnippetInfo(
                learner=submission["learner"],
                learner_id=submission["learner_id"],
                file_name=f"{submission['learner']}_{problem_id}.js",
                code=submission["code"],
                timestamp=submission.get("submission_date", ""),
            )
            for submission in submissions
        ]

        if not snippets:
            return jsonify(
                {
                    "success": True,
                    "matrix": [],
                    "snippets": [],
                    "message": f"No snippets found for problemId: {problem_id} or roomId: {room_id}",
                }
            )

        matrix, snippet_info = codebert_detector.compute_similarity_matrix(snippets)

        # logger.info(
        #     f"Similarity matrix computation completed in {time.time() - start_time:.2f} seconds"
        # )

        response = jsonify(
            {"success": True, "matrix": matrix, "snippets": snippet_info}
        )
        # response.headers.add("Access-Control-Allow-Origin", "*")
        # response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE")
        # response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        # response.headers.add("Access-Control-Allow-Credentials", "true")

        return response

    except Exception as e:
        tb_str = traceback.format_exc()
        # logger.error(f"Error in similarity matrix computation: {str(e)}\n{tb_str}")
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "matrix": [],
                    "snippets": [],
                }
            ),
            500,
        )

@app.route("/api/similarity/sequential", methods=["GET"])
def get_sequential_similarity():
    start_time = time.time()
    try:
        learner_id = request.args.get("learner_id")
        problem_id = request.args.get("problemId")
        room_id = request.args.get("roomId")

        if not all([learner_id, problem_id, room_id]):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Missing required parameters: learner_id, problemId, or roomId",
                    }
                ),
                400,
            )

        # Query MongoDB for the snapshots
        snapshots = list(
            snapshotsCollection.find(
                {
                    "learner_id": ObjectId(learner_id),
                    "problemId": problem_id,
                    "roomId": room_id,
                }
            ).sort("submission_date", 1)
        )  # Sort by timestamp ascending

        for snapshot in snapshots:
            snapshot["_id"] = str(snapshot["_id"])
            snapshot["learner_id"] = str(snapshot["learner_id"])

        if not snapshots:
            return jsonify(
                {
                    "success": True,
                    "sequentialSimilarities": [],
                    "message": f"No snapshots found for this learner and problem with the parameters: {learner_id}, {problem_id}, {room_id}",
                }
            )

        # Convert MongoDB documents to the format expected by compute_sequential_similarities
        formatted_snapshots = [
            {
                "learner_id": str(snapshot["learner_id"]),  # Convert ObjectId to string
                "code": snapshot["code"],
                "timestamp": snapshot.get("submission_date", ""),
                "submission_id": str(snapshot["_id"]),  # Convert ObjectId to string
            }
            for snapshot in snapshots
        ]

        similarities = codebert_detector.compute_sequential_similarities(
            formatted_snapshots
        )

        return jsonify(
            {
                "success": True,
                "sequentialSimilarities": similarities,
                "message": "Sequential similarities computed successfully",
            }
        )
    except Exception as e:
        tb_str = traceback.format_exc()
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "traceback": tb_str,
                    "snapshots": snapshots,
                }
            ),
            500,
        )
    finally:
        print(f"Total time taken: {time.time() - start_time} seconds")


@app.route("/api/similarity/calculate", methods=["POST"])
def calculate_similarity():
    try:
        data = request.get_json()
        code1 = data.get("code1", "")
        code2 = data.get("code2", "")

        if not code1 or not code2:
            return jsonify({"success": False, "error": "Missing code samples"}), 400

        similarity = codebert_detector.calculate_similarity(code1, code2)

        return jsonify(
            {
                "success": True,
                "similarity": float(similarity),  # Ensure number is returned
            }
        )

    except Exception as e:
        print(f"Similarity calculation error: {str(e)}")  # Debug log
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/visualize-similarity", methods=["POST"])
def visualize_similarity():
    try:
        data = request.get_json()
        code1 = data.get("code1", "")
        code2 = data.get("code2", "")

        if not code1 or not code2:
            return jsonify({"success": False, "error": "Missing code samples"}), 400

        print(f"Analyzing code samples: {len(code1)}, {len(code2)} chars")

        image, structures = codebert_detector.visualize_code_similarity(code1, code2)

        print(f"Analysis complete. Found {len(structures)} similar structures")

        return jsonify({"success": True, "image": image, "structures": structures})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze-gradients", methods=["POST"])
def analyze_gradients():
    try:
        print("Starting gradient analysis endpoint...")
        data = request.get_json()

        if not data:
            print("Error: No data received")
            return jsonify({"success": False, "error": "No data received"}), 400

        code1 = data.get("code1", "")
        code2 = data.get("code2", "")

        print(f"Received code samples: {len(code1)} chars, {len(code2)} chars")

        if not code1 or not code2:
            print("Error: Missing code samples")
            return jsonify({"success": False, "error": "Missing code samples"}), 400

        print("Initializing gradient analysis...")
        analysis = codebert_detector.analyze_embedding_gradients(code1, code2)

        print(
            "Gradient analysis complete:",
            {
                "success": analysis.get("success"),
                "has_analysis": bool(analysis.get("analysis")),
                "error": analysis.get("error"),
            },
        )

        return jsonify(analysis)

    except Exception as e:
        print(f"Error in gradient analysis endpoint: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze/attention", methods=["POST"])
def analyze_attention():
    try:
        print("Starting attention analysis...")
        data = request.get_json()

        if not data:
            print("No data received")
            return jsonify({"success": False, "error": "No data received"}), 400

        code1 = data.get("code1", "")
        code2 = data.get("code2", "")

        print(
            f"Processing code snippets:\nCode 1 ({len(code1)} chars)\nCode 2 ({len(code2)} chars)"
        )

        if not code1 or not code2:
            print("Missing code snippets")
            return (
                jsonify({"success": False, "error": "Both code snippets are required"}),
                400,
            )

        try:
            # Get attention maps from the analyzer
            attention_maps = codebert_detector.get_attention_maps(code1, code2)
            if not attention_maps:
                raise ValueError("No attention maps generated")

            print(
                f"Successfully generated attention maps for {len(attention_maps)} layers"
            )

            # Structure the response to match frontend expectations
            return jsonify(
                {
                    "success": True,
                    "attention_data": {
                        "all_attentions": attention_maps,
                        "visualization": attention_maps.get("4", {})
                        .get("3", {})
                        .get("visualization", ""),
                    },
                }
            )

        except Exception as e:
            print(f"Error in attention analysis: {str(e)}")
            print(traceback.format_exc())
            return jsonify({"success": False, "error": str(e)}), 500

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/visualize/attention", methods=["POST"])
def visualize_attention_custom():
    print("Received custom visualize attention request")
    try:
        data = request.get_json()
        code1 = data.get("code1", "")
        code2 = data.get("code2", "")
        layer = data.get("layer", 4)
        head = data.get("head", 3)

        if not code1 or not code2:
            return (
                jsonify({"success": False, "error": "Both code snippets are required"}),
                400,
            )

        attention_data = codebert_detector.analyze_attention(code1, code2, layer, head)

        return jsonify({"success": True, "attention_data": attention_data})
    except Exception as e:
        print(f"Error processing custom visualize attention request: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/analyze_agreement', methods=['POST'])
def analyze_agreement():
    try:
        # Check if files were uploaded
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No files uploaded'}), 400

        files = request.files.getlist('file')
        if not files or all(not file.filename for file in files):
            return jsonify({'success': False, 'error': 'No files selected'}), 400

        # Get aggregation preference
        aggregate = request.form.get('aggregate', 'false').lower() == 'true'

        # Create analyzer instance
        analyzer = AgreementAnalyzer()
        
        # Analyze files
        result = analyzer.analyze_agreement(files, aggregate)
        
        if not result.get('success'):
            return jsonify(result), 400
            
        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': f'Server error: {str(e)}'
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
