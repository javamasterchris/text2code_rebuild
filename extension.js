// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const openAI = require('openai')
const MarkdownIt = require('markdown-it');
const { validateHeaderName } = require('http');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "text2code" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('text2code.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from text2code!');
	});

	let disposable2 = vscode.commands.registerCommand('text2code.text2code', () => {
		vscode.window.showInputBox({
			placeHolder: "What code do you want?"
		}).then((input) => {
			search(input);
		})
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}

function search(input) {
	const config = vscode.workspace.getConfiguration('text2code');
	if(!validate(config)) return;
	if(input) {
		let disposableStatusMessage = vscode.window.setStatusBarMessage("Converting to code...")
		const openai = generateOpenAI(config);
		generateResponse(input, openai, disposableStatusMessage);
	}
}

function validate(config) {
	if(!config.apikey) {
		vscode.window.showErrorMessage("No Open AI key provided in settings.")
		return false;
	}
	return true;
}

function generateOpenAI(config) {
	const configuration = new openAI.Configuration({
		apiKey: config.apikey,
	})
	const openai = new openAI.OpenAIApi(configuration);
	return openai;
}

function generateResponse(input, openAI, disposableStatusMessage) {
	openAI.createCompletion({
		model: "text-davinci-003",
		prompt: input,
		temperature: 0.7,
		max_tokens:256,
		top_p: 1,
		frequency_penality:0,
		presence_penalty:0,
	}).then((response) => {
		displayResult(response);
		disposableStatusMessage.dispose();
	}).catch((error) => {
		vscode.window.showErrorMessage(error.response.data.error.message);
		disposableStatusMessage.dispose();
	})
}

function displayResult(openAIResponse) {
	let panel = vscode.window.createWebviewPanel('webview', 
												'AI Result', 
												{ preserveFocus: true, viewColumn: vscode.ViewColumn.One});
	const md = new MarkdownIt();
	const result = md.render('```\n'  + (openAIResponse.data.choices[0].text || "Nothing found") + '\n```' );
	panel.webview.html = result;
}
// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
