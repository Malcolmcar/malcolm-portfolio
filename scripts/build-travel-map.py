"""Build a dependency-free SVG travel map from Natural Earth's public GeoJSON.
Usage: python3 scripts/build-travel-map.py /path/to/ne_110m_admin_0_countries.geojson
"""
from pathlib import Path
from html import escape
import json,sys
root=Path(__file__).resolve().parent.parent
data=json.loads(Path(sys.argv[1]).read_text())
# Country/territory-level markers, not claims about specific cities visited.
places=[
 ('morocco','Morocco',-7.1,31.8,'africa','Africa',''),
 ('south-africa','South Africa',24.0,-29.0,'africa','Africa','A Stanford Global Seminar in Cape Town.'),
 ('turkey','Turkey',35.0,39.0,'europe','Europe / Asia',''),
 ('germany','Germany',10.5,51.0,'europe','Europe',''),
 ('italy','Italy',12.8,42.5,'europe','Europe',''),
 ('netherlands','Netherlands',5.3,52.1,'europe','Europe',''),
 ('spain','Spain',-3.7,40.5,'europe','Europe','Studying abroad in Madrid with Stanford BOSP.'),
 ('bahamas','Bahamas',-77.4,25.0,'caribbean','Caribbean',''),
 ('belize','Belize',-88.5,17.2,'caribbean','Central America',''),
 ('cayman-islands','Cayman Islands',-81.25,19.3,'caribbean','Caribbean',''),
 ('cuba','Cuba',-79.5,21.5,'caribbean','Caribbean','Part of my Cuban-American roots.'),
 ('dominican-republic','Dominican Republic',-70.2,18.9,'caribbean','Caribbean',''),
 ('jamaica','Jamaica',-77.3,18.1,'caribbean','Caribbean',''),
 ('mexico','Mexico',-102.5,23.6,'americas','North America','A summer in Mexico City working in fintech.'),
 ('turks-and-caicos','Turks and Caicos Islands',-71.8,21.75,'caribbean','Caribbean',''),
 ('united-states','United States of America',-98.5,39.5,'americas','North America','Miami Beach roots. Studying at Stanford.'),
 ('puerto-rico','Puerto Rico',-66.4,18.2,'caribbean','Caribbean','')]
def point(lon,lat):return ((lon+180)*8/3,(85-lat)*8/3)
paths=[]
for feature in data['features']:
 if feature['properties'].get('ADMIN')=='Antarctica':continue
 g=feature['geometry'];polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
 parts=[]
 for rings in polys:
  for ring in rings:
   coords=[point(*p[:2]) for p in ring]
   parts.append('M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in coords)+'Z')
 paths.append('<path d="'+''.join(parts)+'"/>')
land=''.join(paths)
pins=[];buttons=[]
for slug,name,lon,lat,view,region,note in places:
 x,y=point(lon,lat)
 pins.append(f'<g class="travel-pin" data-travel-pin="{slug}" data-view="{view}" data-name="{escape(name)}" data-region="{escape(region)}" data-note="{escape(note,quote=True)}" role="button" tabindex="0" aria-label="Explore {escape(name)}" aria-pressed="false" transform="translate({x:.3f} {y:.3f})"><title>{escape(name)}</title><circle class="travel-pin-halo" r="7.5"/><circle class="travel-pin-dot" r="3.3"/></g>')
 buttons.append(f'<li><button type="button" data-travel-place="{slug}" aria-pressed="false">{escape(name)}</button></li>')
views=[('world','World'),('americas','Americas'),('caribbean','Caribbean'),('europe','Europe'),('africa','Africa')]
controls=''.join(f'<button type="button" data-travel-view="{slug}" aria-pressed="{str(slug=="world").lower()}">{name}</button>' for slug,name in views)
section=f'''<section class="travel" id="places" aria-labelledby="travel-title">
<div class="beyond-heading"><span class="section-number">07</span><div><h2 id="travel-title">Places &amp; Postcards</h2><p>A few stops along the way. <span class="travel-count">17 countries &amp; territories.</span></p></div></div>
<div class="travel-layout"><div class="travel-map-panel"><div class="travel-view-controls" role="group" aria-label="Map views">{controls}</div>
<div class="travel-map-canvas"><svg id="travel-map" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 400" role="group" aria-labelledby="travel-map-title travel-map-desc"><title id="travel-map-title">Places I’ve traveled</title><desc id="travel-map-desc">Select one of seventeen destination markers, or use the destination list. Region buttons offer closer views.</desc><g class="travel-land">{land}</g><g class="travel-pins">{''.join(pins)}</g></svg></div>
<div class="travel-map-legend"><span><i aria-hidden="true"></i> Places I’ve visited</span><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Map: Natural Earth</a></div></div>
<aside class="travel-sidebar" aria-label="Travel destinations"><div class="travel-selection" aria-live="polite"><p class="travel-selection-label" id="travel-region">Explore the map</p><h3 id="travel-place-name">Where to?</h3><p id="travel-place-note">Pick a place to take a closer look.</p></div><ul class="travel-place-list">{''.join(buttons)}</ul></aside></div>
</section>'''
p=root/'dist/index.html';s=p.read_text();assert 'id="places"' not in s
s=s.replace('<section class="writing"',section+'<section class="writing"',1)
# The new map precedes Writing; keep visible section numbers in order.
a=s.index('<section class="writing"');b=s.index('<section class="closing"',a)
s=s[:a]+s[a:b].replace('<span class="section-number">07</span>','<span class="section-number">08</span>',1)+s[b:]
p.write_text(s)
print(f'Built map with {len(paths)} country outlines and {len(places)} unique destinations.')
