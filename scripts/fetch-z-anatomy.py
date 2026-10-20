"""Optional asset rebuild: fetch pinned public source, verify Git blob, extract blend only."""
import hashlib, pathlib, urllib.request, zipfile
revision = '0189e82e4dc5c6a4ebc1d2558b78580665e9b0ef'
expected = 'f43cabc6f366b2a6058dd2ed4a2b3c7b9b2492cb'
archive = pathlib.Path('/tmp/forma-z-anatomy.zip')
if not archive.exists():
    urllib.request.urlretrieve(f'https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/{revision}/Z-Anatomy.zip', archive)
blob = archive.read_bytes()
assert hashlib.sha1(f'blob {len(blob)}\0'.encode() + blob).hexdigest() == expected, 'Source hash mismatch'
with zipfile.ZipFile(archive) as zipped:
    member = 'Z-Anatomy/Startup.blend'
    target = pathlib.Path('/tmp/forma-z-src') / member
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(zipped.read(member))
print(f'Verified source: {target}. Open only with Blender --disable-autoexec.')
