from transformers import RobertaPreTrainedModel, RobertaModel, RobertaTokenizer
import torch
import torch.nn as nn

class CodeBERTForPlagiarism(RobertaPreTrainedModel):
    def __init__(self, config):
        super().__init__(config)
        self.roberta = RobertaModel(config)
        self.dropout = nn.Dropout(config.hidden_dropout_prob)
        # Binary classification: plagiarized (1) or not plagiarized (0)
        self.classifier = nn.Linear(config.hidden_size, 2)
        self.init_weights()

    def forward(
        self,
        input_ids=None,
        attention_mask=None,
        labels=None,
    ):
        outputs = self.roberta(
            input_ids=input_ids,
            attention_mask=attention_mask,
        )
        pooled_output = outputs[1]
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        
        outputs = (logits,)

        if labels is not None:
            loss_fct = nn.CrossEntropyLoss()
            loss = loss_fct(logits.view(-1, 2), labels.view(-1))
            outputs = (loss,) + outputs

        return outputs

def predict_plagiarism(model, tokenizer, code, tokenize_method='default'):
    """
    Predicts whether a single piece of code is plagiarized.
    
    Args:
        model: The loaded CodeBERT model
        tokenizer: The CodeBERT tokenizer
        code: The source code to check (will be converted to str)
        tokenize_method (str): Tokenization method to use ('default', 'per_word', 'per_character')
    
    Returns:
        tuple: (is_plagiarized (bool), confidence (float))
    """
    # Ensure code is string
    try:
        code = str(code) if code is not None else ""
    except Exception as e:
        raise ValueError(f"Could not convert code to string: {str(e)}")

    if not code.strip():
        return False, 0.0  # Return not plagiarized for empty code
        
    try:
        if tokenize_method == 'per_word':
            tokens = tokenize_per_word(code)
            inputs = tokenizer(tokens, is_split_into_words=True, 
                             return_tensors='pt', max_length=512, 
                             padding='max_length', truncation=True)
        elif tokenize_method == 'per_character':
            tokens = tokenize_per_character(code)
            inputs = tokenizer(tokens, is_split_into_words=True, 
                             return_tensors='pt', max_length=512, 
                             padding='max_length', truncation=True)
        else:
            inputs = tokenizer(code, return_tensors='pt', max_length=512, 
                             padding='max_length', truncation=True)
        
        model.eval()
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs[0]
            probabilities = torch.softmax(logits, dim=1)
            prediction = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][prediction].item()
            
        return bool(prediction), confidence
        
    except Exception as e:
        print(f"Error processing code: {str(e)}")
        return False, 0.0  # Return not plagiarized on error

def get_plagiarism_probability(submissions, model_type="default"):
    """
    Process multiple submissions and check each for plagiarism.
    
    Args:
        submissions (dict): Dictionary of {filename: code_content}
        model_type (str): Type of model to use
        
    Returns:
        list: List of dictionaries containing plagiarism reports
    """
    # Select the appropriate model based on type
    model_paths = {
        "default": "bert_models/codebert_plagiarism_model_default.pth",
        "character": "bert_models/codebert_plagiarism_model_character.pth",
        "tree_default": "bert_models/codebert_plagiarism_model_tree_sitter_default.pth",
        "tree_word": "bert_models/codebert_plagiarism_model_tree_sitter_word.pth",
        "tree_char": "bert_models/codebert_plagiarism_model_tree_sitter_character.pth"
    }
    
    if model_type not in model_paths:
        raise ValueError(f"Unknown model type: {model_type}")
    
    model = load_model(model_paths[model_type])
    tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
    
    plagiarism_reports = []
    
    # Process each submission
    for file_name, submission in submissions.items():
        is_plagiarized, confidence = predict_plagiarism(model, tokenizer, submission)
        plagiarism_reports.append({
            'file_name': file_name,
            'is_plagiarized': is_plagiarized,
            'confidence': confidence
        })
    
    return plagiarism_reports

def load_model(model_path):
    """
    Load a pre-trained CodeBERT model for plagiarism detection.
    
    Args:
        model_path (str): Path to the model file
        
    Returns:
        CodeBERTForPlagiarism: Loaded model
    """
    # Initialize model
    model = CodeBERTForPlagiarism.from_pretrained("microsoft/codebert-base")
    
    # Load weights with CPU mapping
    state_dict = torch.load(model_path, map_location=torch.device('cpu'))
    
    # If the state dict uses 'codebert.' prefix instead of 'roberta.'
    new_state_dict = {}
    for key, value in state_dict.items():
        if key.startswith('codebert.'):
            new_key = key.replace('codebert.', 'roberta.')
        else:
            new_key = key
        new_state_dict[new_key] = value
    
    # Load the state dictionary
    model.load_state_dict(new_state_dict)
    
    # Set to evaluation mode
    model.eval()
    return model