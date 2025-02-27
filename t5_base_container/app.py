from transformers import T5Tokenizer, T5ForConditionalGeneration
import json

# Load model and tokenizer
tokenizer = T5Tokenizer.from_pretrained('t5-small')
model = T5ForConditionalGeneration.from_pretrained('t5-small')

def handler(event, context):
    try:
        # Parse the body from the event as JSON
        body = json.loads(event.get("body", "{}"))  # Safely parse the body as JSON
        
        # Extract input_text from the body
        input_text = body.get("input_text", "")
        
        if not input_text:
            raise ValueError("No input_text found in the request body.")
        
        # Tokenize input text
        input_ids = tokenizer(input_text, return_tensors="pt", padding=True, truncation=True)

        # Generate output
        outputs = model.generate(**input_ids)
        output_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Return the output
        return {
            "statusCode": 200,
            "body": json.dumps({"output_text": output_text})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }