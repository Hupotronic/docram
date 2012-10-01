// Docram's JSHint settings.
/*jshint asi:true curly:false strict:false node:true */

// Basic setup and libraries.

var fs       = require('fs'),
		path     = require('path'),
		globlib  = require('glob-whatev'),
		glob     = globlib.glob,
		hl       = require('highlight').Highlight,
		md       = require('node-markdown').Markdown,
		jade     = require('jade'),
		program  = require('commander')

// The main function.

exports.run = function(pattern, cssBase, cssCode, outputDir, tabWidth, tmpl) {

	var styleBase = cssBase ? cssBase : 'docram.css',
			styleCode = cssCode ? cssCode : 'github.css',
			output    = outputDir ? outputDir : 'docs',
			tabwidth  = tabWidth ? tabWidth : 2,
			execpath  = path.resolve(),
			template  = tmpl ? fs.readFileSync(tmpl, 'UTF-8') : fs.readFileSync('lib/docram.jade', 'UTF-8')

			template  = jade.compile(template, {pretty: true})
			output    = path.normalize(execpath + '/' + output + '/')
	
	// Process each file.
	glob(pattern).forEach(function(filepath){

		// Initialize all the variables that we're going to need.
		var infile   = path.normalize(execpath+'/'+filepath),
				ext      = path.extname(infile),
				filename = path.basename(infile),
				name     = path.basename(infile, ext),
				codefile = fs.readFileSync(infile, 'UTF-8'),
				tabs     = '<span>'+Array(tabwidth+1).join(' ')+'</span>',
				outfile  = output+name+'.html',
				lines    = codefile.split('\n'), line,
				sections = [], trimNewlines,
				comment  = '//',
				comfunc  = function(str){return str.replace(/(.)/g,'\\$1')},
				comregex = new RegExp('^\\s*'+comfunc(comment)+'\\s?(.*)'),
				docText  = '', codeText = '',
				match, section = 0, opts

		// This function trims newlines from the beginning and end of sections.
		trimNewlines = function(txt) {
			txt = txt.replace(/^\n*/,'')
			txt = txt.replace(/\n*$/,'')
			return txt
		}

		// ## Iterating over the code
		for ( var i = 0, ii = lines.length; i < ii; i++ ) {
			line = lines[i]
			// Check the current line against the comment regex.
			match = line.match(comregex)
			if(match) {
				// Here we check if we just changed from "code" to "documentation"
				// and if we did, push the current doc/code into its own section and
				// zero the texts.
				if(section === 0) {
					if(trimNewlines(docText) || trimNewlines(codeText)) {
						sections.push({doc: docText, code: codeText})
						docText = codeText = ''
					}
				}
				// Check for markdown headers and make them into their own sections.
				if(match[1].substr(0,1) === '#') {
					if(trimNewlines(docText) || trimNewlines(codeText)) {
						sections.push({doc: docText, code: codeText})
						docText = codeText = ''
					}
					docText += match[1]
					sections.push({doc: docText, code: ''})
					docText = ''
				} else {
				// Add current line to `docText`.
				docText += match[1] + '\n'
				}
				// Set current section to "documentation"
				section = 1
			} else {
				// Set section to "code" and add current line to `codeText`.
				codeText += line.replace(/\r?\n?/,'') + '\n'
				section = 0
			}
		}
		// Do a final check and push for any leftover documentation/code.
		if(codeText.length || docText.length) {
			sections.push({doc: docText, code: codeText})
			docText = codeText = ''
		}

		// Run the documentation through markdown and code through highlighter.
		for ( var j = 0, jj = sections.length; j < jj; j++ ) {
			section = sections[j]
			if(section.doc.length)  section.doc = md(trimNewlines(section.doc))
			if(section.code.length) section.code = hl(trimNewlines(section.code), tabs)
		}

		console.log(sections)
		opts = {
			"sections": sections,
			"fname": filename,
			"styleBase": styleBase,
			"styleCode": styleCode
		}
		fs.writeFileSync(outfile, template(opts))
	})

}

// The command-line interface.
exports.cli = function() { console.log('Nothing to see here yet!') }