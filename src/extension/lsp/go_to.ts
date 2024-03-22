import * as vs from "vscode";
import * as ls from "vscode-languageclient";
import { disposeAll } from "../../shared/utils";
import { showCode } from "../../shared/vscode/utils";
import { LspAnalyzer } from "../analysis/analyzer_lsp";
import * as editors from "../editors";

abstract class LspGoToCommand implements vs.Disposable {
	protected disposables: vs.Disposable[] = [];

	constructor(protected readonly analyzer: LspAnalyzer) { }

	protected async goTo(): Promise<void> {
		const editor = editors.getActiveDartEditor();
		if (!editor) {
			void vs.window.showWarningMessage("No active Dart editor.");
			return;
		}

		const location = await this.getLocation(
			{
				position: this.analyzer.client.code2ProtocolConverter.asPosition(editor.selection.start),
				textDocument: this.analyzer.client.code2ProtocolConverter.asVersionedTextDocumentIdentifier(editor.document),
			},
		);

		if (!location)
			return;

		const codeLocation = this.analyzer.client.protocol2CodeConverter.asLocation(location);
		const elementDocument = await vs.workspace.openTextDocument(codeLocation.uri);
		const elementEditor = await vs.window.showTextDocument(elementDocument);
		showCode(elementEditor, codeLocation.range, codeLocation.range, codeLocation.range);
	}

	abstract getLocation(params: ls.TextDocumentPositionParams): Promise<ls.Location | null>;

	public dispose(): any {
		disposeAll(this.disposables);
	}
}

export class LspGoToSuperCommand extends LspGoToCommand {
	constructor(analyzer: LspAnalyzer) {
		super(analyzer);
		this.disposables.push(vs.commands.registerCommand("dart.goToSuper", this.goTo, this));
	}

	getLocation(params: ls.TextDocumentPositionParams): Promise<ls.Location | null> {
		return this.analyzer.getSuper(params);
	}
}

export class LspGoToAugmentedCommand extends LspGoToCommand {
	constructor(analyzer: LspAnalyzer) {
		super(analyzer);
		this.disposables.push(vs.commands.registerCommand("dart.goToAugmented", this.goTo, this));
	}

	getLocation(params: ls.TextDocumentPositionParams): Promise<ls.Location | null> {
		return this.analyzer.getAugmented(params);
	}
}

export class LspGoToAugmentationCommand extends LspGoToCommand {
	constructor(analyzer: LspAnalyzer) {
		super(analyzer);
		this.disposables.push(vs.commands.registerCommand("dart.goToAugmentation", this.goTo, this));
	}

	getLocation(params: ls.TextDocumentPositionParams): Promise<ls.Location | null> {
		return this.analyzer.getAugmentation(params);
	}
}