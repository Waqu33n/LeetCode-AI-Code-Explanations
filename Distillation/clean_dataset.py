import pandas as pd
import json
import re

df = pd.read_parquet("hf://datasets/cassanof/leetcode-solutions/data/train-00000-of-00001-b894c52e31287062.parquet")
output_file = 'cleaned_dataset.jsonl'
def extract_human_prompts():
    human_prompts = []

    print('Reading from input dataset')

    df_filtered = df.drop_duplicates(subset='slug', keep='first')
    df_filtered.to_parquet('filtered_file.parquet', index=False)

    human_prompts = df_filtered['python_solutions'].tolist()

    pattern = re.compile(r'class Solution(\(object\))?:\s*')

    with open(output_file, 'w', encoding='utf-8') as file:
        for prompt in human_prompts:
            cleaned_prompt = pattern.sub('', prompt).lstrip()
            json_obj = {'prompt': cleaned_prompt}
            json.dump(json_obj, file, ensure_ascii=False)
            file.write('\n')

    print('Succesfully extracted non-duplicate prompts')

extract_human_prompts()