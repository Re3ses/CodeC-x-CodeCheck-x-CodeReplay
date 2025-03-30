# main.py
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from analyzer import CombinedAnalyzer
from analyzer.codebert_analyzer import SnippetInfo, SequentialSimilarity
from analyzer.codebert_attention import CodeBERTAttentionAnalyzer
from analyzer.attention import (
    CodeSimilarityAnalyzer as OriginalCodeSimilarityAnalyzer,
)  # Renamed to avoid conflict

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
def get_similarity_matrix():
    start_time = time.time()
    try:
        problem_id = request.args.get("problemId")
        room_id = request.args.get("roomId")
        verdict = request.args.get("verdict")

        if not problem_id and not room_id:
            return (
                jsonify(
                    {"success": False, "message": "No problemId or roomId provided"}
                ),
                400,
            )

        query = {"verdict": verdict or "ACCEPTED"}
        if problem_id:
            query["problem"] = problem_id
        if room_id:
            query["room"] = room_id

        # To get the highest-scoring submission per learner:
        submissions = list(
            userSubmissionsCollection.aggregate(
                [
                    {"$match": query},
                    {"$sort": {"score_overall_count": -1}},  # Sort by score descending
                    {"$group": {"_id": "$learner_id", "doc": {"$first": "$$ROOT"}}},
                    {"$replaceRoot": {"newRoot": "$doc"}},
                ]
            )
        )

        for submission in submissions:
            submission["_id"] = str(submission["_id"])
            submission["learner_id"] = str(submission["learner_id"])

        print("submissions", submissions)

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
                    "submissions": submissions,
                }
            )

        matrix, snippet_info = codebert_detector.compute_similarity_matrix(snippets)

        return jsonify({"success": True, "matrix": matrix, "snippets": snippet_info})

    except Exception as e:
        tb_str = traceback.format_exc()
        print(tb_str)
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "traceback": tb_str,
                    "matrix": [],
                    "snippets": [],
                }
            ),
            500,
        )
    finally:
        print(f"Total time taken: {time.time() - start_time} seconds")


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


if __name__ == "__main__":
    app.run(debug=True)
