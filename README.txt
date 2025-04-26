To set up this chrome extension to run locally adhere to the following steps:

    1) Install the dependencies in Requirements.txt

    2) Enter google chrome's settings menu, find extensions, enter developer mode,
    and import this chrome extension using the manifest.json file

    3) Install your trained llm in gguf format into ollama for inference using
    the fast_app.py file.

    4) For windows users, open the start_extension.bat file to automatically open
    the extension. For other operating systems, run the fast_app.py script, wait for
    "Model warmed up" to print, and open LeetCode in chrome.

When using Leetcode, highlight any code blocks in a submitted solution and right
click on it. From there, you should be able to select "Explain Code" and see a modal
appear on the screen. Then, the outputted explanation will quickly appear in the modal.
Once the explanation is completed, you can submit additional questions about the code
block in the section below it.