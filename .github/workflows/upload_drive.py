import os
import json
import sys
import traceback
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

def log_error(message):
    print(f"::error::{message}", file=sys.stderr)
    print(f"FEHLER: {message}", file=sys.stderr)

def main():
    sa_json_raw = os.environ.get("GDRIVE_SA_JSON", "").strip()
    folder_id = os.environ.get("GDRIVE_FOLDER_ID", "").strip()

    if not sa_json_raw:
        log_error("Secret GDRIVE_SA_JSON ist leer oder fehlt im Workflow environment.")
        sys.exit(1)

    if not folder_id:
        log_error("Secret GDRIVE_FOLDER_ID ist leer oder fehlt im Workflow environment.")
        sys.exit(1)

    try:
        creds_dict = json.loads(sa_json_raw)
    except json.JSONDecodeError as e:
        log_error(f"GDRIVE_SA_JSON enthaelt kein gueltiges JSON-Format: {e}")
        sys.exit(1)

    try:
        creds = service_account.Credentials.from_service_account_info(
            creds_dict,
            scopes=["https://www.googleapis.com/auth/drive"]
        )
        service = build("drive", "v3", credentials=creds)
    except Exception as e:
        log_error(f"Fehler bei der Erstellung des Google Drive Service Client: {e}")
        traceback.print_exc()
        sys.exit(1)

    file_name = "repo_bundle.txt"
    if not os.path.exists(file_name):
        log_error(f"Datei {file_name} existiert nicht im aktuellen Verzeichnis.")
        sys.exit(1)

    try:
        query = f"'{folder_id}' in parents and name='{file_name}' and trashed=false"
        results = service.files().list(q=query, fields="files(id)").execute()
        files = results.get("files", [])

        media = MediaFileUpload(file_name, mimetype="text/plain", resumable=True)

        if files:
            file_id = files[0]["id"]
            service.files().update(fileId=file_id, media_body=media).execute()
            print(f"Bestehende Datei {file_name} in Google Drive aktualisiert.")
        else:
            file_metadata = {"name": file_name, "parents": [folder_id]}
            service.files().create(body=file_metadata, media_body=media, fields="id").execute()
            print(f"Neue Datei {file_name} in Google Drive erstellt.")

    except HttpError as err:
        status_code = err.resp.status
        reason = err._get_reason()
        if status_code == 404:
            log_error(f"Ordner-ID ({folder_id}) nicht gefunden oder Service Account besitzt keine Rechte.")
        elif status_code == 403:
            log_error("Zugriff verweigert. Der Service Account verfuegt nicht ueber Editor-Rechte fuer diesen Ordner.")
        else:
            log_error(f"Google Drive API Fehler HTTP {status_code}: {reason}")
        sys.exit(1)
    except Exception as err:
        log_error(f"Unerwarteter Fehler beim Upload: {err}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
