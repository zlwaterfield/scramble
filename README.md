# Scramble - Open-Source Grammarly Alternative

> Note: this project has lots of users but I'm not actively developing it so if you'd like to be a maintainer on this project let me know!

Scramble is an open-source Chrome extension that leverages AI to enhance your writing directly in your browser. It's designed to be a more customizable alternative to Grammarly by using specific prompts and allowing you to configure the LLM provider, model, and endpoint.

## Extensions

- Chrome: https://chromewebstore.google.com/detail/scramble/mkaljgnigabhmjfookbokejhfghmkffo
- Firefox: coming soon

## Installation

#### Chrome Installation

- Clone this repository
- Run `npm install`
- Run `npm run build`
- Open Chrome and go to chrome://extensions/
- Enable "Developer mode" in the top right
- Click "Load unpacked" and select the extension directory (dist/chrome)

#### Firefox Installation

- Clone this repository
- Run `npm install`
- Run `npm run build`
- Open Firefox and go to about:debugging#/runtime/this-firefox
- Click "Load Temporary Add-on"
- Navigate to the extension directory (dist/firefox) and select manifest.json

## Development

When developing you'll need to run `npx tailwindcss -i src/libs/tw-input.css -o src/libs/tw-output.css --minify --watch` in order to build the css on the fly. The runs automatically when you run `npm run build`.

## Usage

1. Highlight text on any webpage
2. Right-click to open the context menu
3. Select "Scramble" and choose a text enhancement option
4. Wait for the AI to process and enhance your text

Screenshot:

<img width="600" alt="Screenshot 2024-09-17 at 10 14 30 PM" src="https://github.com/user-attachments/assets/7a8685e5-94dd-47be-a141-f84bcbf1321f">

## Supported LLMs

- OpenAI
- Anthropic
- Groq
- OpenRouter
- Ollama
- LM Studio

## Default Prompts

Scramble comes with several pre-configured text enhancement options:

1. Fix spelling and grammar
2. Improve writing
3. Make more professional
4. Simplify text
5. Summarize text
6. Expand text
7. Convert to bullet points

## Custom Prompts

You can also create your own custom prompts. They will show up in the list of prompts as soon as you save.

<img width="755" alt="Screenshot 2024-11-02 at 10 00 47 AM" src="https://github.com/user-attachments/assets/add93ae6-0018-4845-91cc-a43a1d95077c">


## Future Features

Planned features include:

- Support for additional language models (LLMs)
- Multiple LLM configurations at the same time
- Enhanced context awareness
- View diff between original and improved text
- Underline grammar / spelling issues

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

