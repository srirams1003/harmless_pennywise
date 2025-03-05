docker start harmless_pennywise_db
sleep 20
python database.py
uvicorn main:app --reload
