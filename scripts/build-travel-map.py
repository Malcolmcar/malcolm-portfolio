"""Update only the portfolio's Natural Earth geography, preserving the design.

Usage: python3 scripts/build-travel-map.py /path/to/ne_110m_admin_0_countries.geojson
No dependencies are required. Destination content and interactions are maintained
in dist/index.html and dist/script.js; this command never replaces them.
"""
from pathlib import Path
import json
import re
import sys


def point(lon, lat):
    return ((lon + 180) * 8 / 3, (85 - lat) * 8 / 3)


def build_land(data):
    paths = []
    for feature in data['features']:
        if feature['properties'].get('ADMIN') == 'Antarctica':
            continue
        geometry = feature['geometry']
        if geometry['type'] not in ('Polygon', 'MultiPolygon'):
            continue
        polygons = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
        parts = []
        for rings in polygons:
            for ring in rings:
                coords = [point(*position[:2]) for position in ring]
                parts.append('M' + 'L'.join(f'{x:.2f},{y:.2f}' for x, y in coords) + 'Z')
        paths.append('<path d="' + ''.join(parts) + '"/>')
    return '\n'.join(paths)


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    data = json.loads(Path(sys.argv[1]).read_text())
    land = build_land(data)
    if not land:
        raise SystemExit('No country polygons found; index.html was left unchanged.')
    target = Path(__file__).resolve().parent.parent / 'dist/index.html'
    source = target.read_text()
    updated, count = re.subn(r'(<g class="travel-land">).*?(</g>)', lambda match: match[1] + '\n' + land + '\n' + match[2], source, count=1, flags=re.S)
    if count != 1:
        raise SystemExit('Expected one existing travel-land group; index.html was left unchanged.')
    target.write_text(updated)
    print('Updated map geography; retained destination data, page layout, and interactions.')


if __name__ == '__main__':
    main()
