import json
import os

from transformers import T5Tokenizer
from nltk.translate.bleu_score import sentence_bleu

# Load the tokenizer at init time so it's not done per-invocation.
# Point `pretrained_tokenizer_dir` to the local directory where tokenizer files are stored.
pretrained_tokenizer_dir = os.path.join(os.path.dirname(__file__), "tokenizer")
tokenizer = T5Tokenizer.from_pretrained(pretrained_tokenizer_dir)

def lambda_handler(event, context):
    print("Received event:", event)
    
    # event['body'] contains a JSON string
    payload = json.loads(event['body'])
    
    reference_text = payload.get('reference', "")
    candidate_text = payload.get('candidate', "")

    reference_tokens = tokenizer.tokenize(reference_text)
    candidate_tokens = tokenizer.tokenize(candidate_text)

    bleu_score = sentence_bleu([reference_tokens], candidate_tokens)

    return {
        'statusCode': 200,
        'body': json.dumps({'bleu_score': bleu_score})
    }