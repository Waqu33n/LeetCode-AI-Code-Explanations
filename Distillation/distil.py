import json, os, time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('API_KEY')
MODEL = 'qwen-2.5-coder-32b'
PROMPTS = 'cleaned_dataset.jsonl'
OUTPUT_FILE = 'distilled_outputs.jsonl'
MAX_RETRIES = 3
RETRY_DELAY = 5

remaining_requests = 1000 # Daily request limit
remaining_tokens = 6000 # Token per minute limit
reset_request_time = time.time() + (24 * 60 * 60)
reset_tokens_time = time.time() + (60)

def read(file):
    if not os.path.exists(file):
        return []
    with open(file, 'r', encoding='utf-8') as f:
        return [json.loads(line) for line in f.readlines()]
    
def save_output(prompt, response):
    with open(OUTPUT_FILE, 'a') as f:
        json.dump({'prompt': prompt, 'response': response}, f)
        f.write('\n')

def wait_for_limits():
    global remaining_requests, remaining_tokens, reset_request_time, reset_tokens_time

    now = time.time()
    if remaining_requests <= 0 and now < reset_request_time:
        wait_time = reset_request_time - now
        print(f"Must wait {wait_time:.2f} for request limit to reset")
        time.sleep(wait_time)
        remaining_requests = 1000

    if remaining_tokens <= 0 and now <reset_tokens_time:
        wait_time = reset_tokens_time - now
        print(f"Must wait {wait_time:.2f} for token limit to reset")
        time.sleep(wait_time)
        remaining_tokens = 6000

def process_prompt(client, prompt):
    global remaining_requests, remaining_tokens, reset_request_time, reset_tokens_time
    for attempt in range(MAX_RETRIES):
        try:
            wait_for_limits()

            with client.chat.completions.with_streaming_response.create(
                messages=[
                    {'role': 'system', 'content': "You are an expert Python programmer and teacher. "
                    "Your task is to explain the given Python code snippet, including its logic and "
                    "any specific algorithms or computer science concepts it may be using. Provide a "
                    "detailed and clear explanation so that a new computer science student or software "
                    "engineer can understand it. Please try to keep your responses under 500 words."},
                    {'role': 'user', 'content': prompt}
                ],
                model=MODEL
            ) as response:

                response_text = ''
                for line in response.iter_lines():
                    if line:
                        response_text += line
                return response_text
        except Exception as e:
            print(f"Error processing prompt '{prompt[50:]}...': {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
    return None

def main():
    client = Groq(api_key=API_KEY)

    outputs = read(OUTPUT_FILE)
    processed = {output['prompt'] for output in outputs}
    prompts = read(PROMPTS)

    prompts_todo = [p for p in prompts if p['prompt'] not in processed]

    if not prompts_todo:
        print("All responses for prompts have already been generated")
        return

    print(f'Processing {len(prompts_todo)} prompts...')

    for prompt_data in prompts_todo:
        prompt = prompt_data['prompt']
        response = process_prompt(client, prompt)

        if response:
            save_output(prompt, response)
            print(f'Succesfully stored reponse of {prompt[50:]}...')
        else:
            print(f'Failed to save response for {prompt[50:]}...')

main()