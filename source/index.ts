import * as typescript from 'typescript'
import * as path from 'path'
import * as fs from 'fs'

const loadAsFile = (x: string): string | null => {
	// TODO: resolveJsonModule support
	// TODO: tsx support
	return fs.existsSync(x + '.ts') ? x + '.js' : null
}

const loadIndex = (x: string): string | null => {
	// TODO: resolveJsonModule support
	// TODO: tsx support
	return fs.existsSync(path.join(x, 'index.ts')) ? path.join(x, 'index.js') : null
}

const loadAsDirectory = (x: string): string | null => {
	const m = getMainField(x)
	return m !== null
		? loadAsFile(m) || loadIndex(m) || loadIndex(x)
		: loadIndex(x)
}

const getMainField = (x: string): string | null => {
	try {
		const data = fs.readFileSync(path.join(x, 'package.json'), { encoding: 'utf8' })
		const pkg = JSON.parse(data)
		return typeof pkg.main === 'string' ? path.join(x, pkg.main.replace(/.js$/, '')) : null
	} catch (_) {
		return null
	}
}

const transformer = (_: typescript.Program) => (transformationContext: typescript.TransformationContext) => (sourceFile: typescript.SourceFile) => {
	const compilerOptions = transformationContext.getCompilerOptions()
	function visitNode(node: typescript.Node): typescript.VisitResult<typescript.Node> {
		if (shouldMutateModuleSpecifier(node)) {
			if (compilerOptions.moduleResolution === typescript.ModuleResolutionKind.NodeJs) {
				const containingDirectory = path.dirname(sourceFile.fileName)
				const moduleName = node.moduleSpecifier.text.replace(/\/$/, '')
				const modulePath = path.join(containingDirectory, moduleName)
				const resolved = loadAsFile(modulePath) || loadAsDirectory(modulePath)
				if (resolved !== null) {
					const p = path.relative(containingDirectory, resolved)
					const newModuleSpecifier = typescript.createLiteral(p.startsWith('../') ? p : './' + p)
					if (typescript.isImportDeclaration(node)) {
						return typescript.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, newModuleSpecifier)
					} else if (typescript.isExportDeclaration(node)) {
						return typescript.updateExportDeclaration(node, node.decorators, node.modifiers, node.exportClause, newModuleSpecifier)
					}
				} else {
					throw new Error(`${moduleName} not found`)
				}
			} else {
				if (typescript.isImportDeclaration(node)) {
					const newModuleSpecifier = typescript.createLiteral(`${node.moduleSpecifier.text}.js`)
					return typescript.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, newModuleSpecifier)
				} else if (typescript.isExportDeclaration(node)) {
					const newModuleSpecifier = typescript.createLiteral(`${node.moduleSpecifier.text}.js`)
					return typescript.updateExportDeclaration(node, node.decorators, node.modifiers, node.exportClause, newModuleSpecifier)
				}
			}
		}

		return typescript.visitEachChild(node, visitNode, transformationContext)
	}

	function shouldMutateModuleSpecifier(node: typescript.Node): node is (typescript.ImportDeclaration | typescript.ExportDeclaration) & { moduleSpecifier: typescript.StringLiteral } {
		if (!typescript.isImportDeclaration(node) && !typescript.isExportDeclaration(node)) return false
		if (node.moduleSpecifier === undefined) return false
		// only when module specifier is valid
		if (!typescript.isStringLiteral(node.moduleSpecifier)) return false
		// only when path is relative
		if (!node.moduleSpecifier.text.startsWith('./') && !node.moduleSpecifier.text.startsWith('../')) return false
		// only when module specifier has no extension
		if (path.extname(node.moduleSpecifier.text) !== '') return false
		return true
	}

	return typescript.visitNode(sourceFile, visitNode)
}

export default transformer
