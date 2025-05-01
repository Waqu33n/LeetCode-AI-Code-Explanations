This repository contains all the code I used for creating this Leetcode solution explanation tool. The Distillation directory includes the dataset I used to generate expected outputs from the teacher with and the script I used to get those outputs. The FineTuning directory has the colab notebooks I used to fine tune my student model using the generated teacher outputs. These notebooks also test the model with a sample code snippet and save the model as a merged directory rather than just LoRA adapters. The final model in gguf format is too large to store in this repository, but can be found on HuggingFace (https://huggingface.co/Wak3en/1.1B-Tiny-Llama-Distilled-Code-Explainer/tree/main) The Extension directory contains the code that actually runs the tool. This hinges on installing your model of choice (the distilled tiny model in my case) through Ollama and loading it on the fast_app.py script.

To set up this chrome extension to run locally adhere to the following steps:

    1) Install the dependencies in Requirements.txt

    2) Enter google chrome's settings menu, find extensions, enter developer mode,
    and import this chrome extension using the manifest.json file in Extentions/FrontEnd/

    3) Install your trained llm in gguf format into ollama for inference using
    the fast_app.py file. The model I distilled can be found here: https://huggingface.co/Wak3en/1.1B-Tiny-Llama-Distilled-Code-Explainer/tree/main

    4) For windows users, open the start_extension.bat file to automatically open
    the extension. For other operating systems, run the fast_app.py script, wait for
    "Model warmed up" to print, and open LeetCode in chrome.

When using Leetcode, highlight any code blocks in a submitted solution and right
click on it. From there, you should be able to select "Explain Code" and see a modal
appear on the screen. Then, the outputted explanation will quickly appear in the modal.
Once the explanation is completed, you can submit additional questions about the code
block in the section below it.
