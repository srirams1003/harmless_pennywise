docker start harmless_pennywise_db
sleep 15
python database.py
uvicorn main:app --reload
