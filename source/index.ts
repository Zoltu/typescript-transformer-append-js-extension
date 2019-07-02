import * as typescript from "typescript"

const transformer = (_: typescript.Program) => (transformationContext: typescript.TransformationContext) => (sourceFile: typescript.SourceFile) => {
	function visitNode(node: typescript.Node): typescript.VisitResult<typescript.Node> {
		if (shouldMutateModuleSpecifier(node)) {
			const newModuleSpecifier = typescript.createLiteral(`${node.moduleSpecifier.text}.js`)
			node = typescript.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, newModuleSpecifier)
		}

		return typescript.visitEachChild(node, visitNode, transformationContext)
	}

	function shouldMutateModuleSpecifier(node: typescript.Node): node is typescript.ImportDeclaration & { moduleSpecifier: typescript.StringLiteral } {
		if (!typescript.isImportDeclaration(node)) return false
		// only when module specifier is valid
		if (!typescript.isStringLiteral(node.moduleSpecifier)) return false
		// only when path is relative
		if (!node.moduleSpecifier.text.startsWith('./') && !node.moduleSpecifier.text.startsWith('../')) return false
		// only when module specifier has no extension
		if (node.moduleSpecifier.text.indexOf('.', 2) !== -1) return false
		return true
	}

	return typescript.visitNode(sourceFile, visitNode)
}

export default transformer
