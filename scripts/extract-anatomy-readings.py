"""Use Blender --background --disable-autoexec SOURCE.blend --python this_file -- OUTPUT.json.
Only read text data; never execute source text blocks or add-ons.
"""
import bpy,json,pathlib,sys
output=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '/tmp/forma-source-texts.json'
rows={text.name:text.as_string() for text in bpy.data.texts if not text.name.endswith('.py') and 'https://en.wikipedia.org/wiki/' in text.as_string()}
pathlib.Path(output).write_text(json.dumps(rows))
print('Exported',len(rows),'source text records for attribution-aware preparation')
