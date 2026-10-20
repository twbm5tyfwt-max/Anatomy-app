"""Optional geometry rebuild prerequisite: download and verify the recorded BodyParts3D STL sources.
The application itself uses the bundled GLB; normal npm install/build does not need this download.
"""
import concurrent.futures, hashlib, json, pathlib, time, urllib.request
root = pathlib.Path(__file__).resolve().parents[1]
source = json.loads((root / 'scripts/bodyparts-source.json').read_text())
cache = pathlib.Path('/tmp/forma-stl')
cache.mkdir(exist_ok=True)
base = f"https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/{source['revision']}/assets/BodyParts3D_data/stl/"
def fetch(model):
    destination = cache / (model['id'] + '.stl')
    if destination.exists():
        data = destination.read_bytes()
    else:
        for attempt in range(3):
            try:
                data = urllib.request.urlopen(base + destination.name, timeout=45).read()
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(attempt + 1)
    digest = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    if digest != model['sha1']:
        raise ValueError(f"Source integrity mismatch: {model['id']}")
    destination.write_bytes(data)
    return len(data)
if __name__ == '__main__':
    total = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for count, size in enumerate(pool.map(fetch, source['models']), 1):
            total += size
            if count % 100 == 0:
                print(f"{count}/{len(source['models'])} verified; {total / 1e6:.1f} MB", flush=True)
    print(f"Verified {len(source['models'])} source meshes ({total / 1e9:.2f} GB).")
