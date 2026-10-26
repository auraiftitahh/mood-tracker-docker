import os
from datetime import date
from uuid import UUID
import psycopg
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder=None)
app.config['MAX_CONTENT_LENGTH'] = 16384

def db():
    return psycopg.connect(host='database', dbname=os.environ['POSTGRES_DB'],
        user=os.environ['POSTGRES_USER'], password=os.environ['POSTGRES_PASSWORD'])

with db() as conn:
    conn.execute('CREATE TABLE IF NOT EXISTS entries (id UUID PRIMARY KEY, date DATE NOT NULL, mood TEXT NOT NULL, note TEXT NOT NULL, updated BIGINT NOT NULL)')

@app.get('/api/health')
def health():
    with db() as conn:
        conn.execute('SELECT 1')
    return jsonify(status='ok')

@app.get('/api/entries')
def listing():
    with db() as conn:
        rows = conn.execute('SELECT id,date,mood,note,updated FROM entries ORDER BY date DESC,updated DESC').fetchall()
    return jsonify([dict(id=str(r[0]), date=r[1].isoformat(), mood=r[2], note=r[3], updated=r[4]) for r in rows])

@app.put('/api/entries/<entry_id>')
def save(entry_id):
    data = request.get_json(silent=True)
    try:
        UUID(entry_id)
        day = date.fromisoformat(data['date'])
        assert day <= date.today()
        assert data['mood'] in ('happy','good','neutral','sad','angry')
        assert isinstance(data['note'],str) and len(data['note']) <= 2000
        updated = int(data['updated'])
    except (ValueError, TypeError, KeyError, AssertionError):
        return jsonify(error='Data catatan tidak valid'),400
    with db() as conn:
        conn.execute('INSERT INTO entries VALUES (%s,%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET date=EXCLUDED.date,mood=EXCLUDED.mood,note=EXCLUDED.note,updated=EXCLUDED.updated',
            (entry_id,day,data['mood'],data['note'],updated))
    return jsonify(status='saved')

@app.delete('/api/entries/<entry_id>')
def delete(entry_id):
    try:
        UUID(entry_id)
    except ValueError:
        return jsonify(error='ID tidak valid'),400
    with db() as conn:
        conn.execute('DELETE FROM entries WHERE id=%s',(entry_id,))
    return '',204

@app.get('/')
def index():
    return send_from_directory('public','index.html')

@app.get('/<path:path>')
def static_file(path):
    return send_from_directory('public',path)
