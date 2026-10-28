
from pathlib import Path
from datetime import datetime
import sqlite3

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "spa_ai.db"
BACKUP_DIR = BASE_DIR / "backups"


def main():
    BACKUP_DIR.mkdir(exist_ok=True)

    if not DB_PATH.is_file():
        raise RuntimeError("Khong tim thay database goc")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"spa_ai_before_fk_{timestamp}.db"

    # Sao lưu bằng SQLite Backup API
    with sqlite3.connect(str(DB_PATH)) as source:
        with sqlite3.connect(str(backup_path)) as backup:
            source.backup(backup)

    print("Da sao luu:", backup_path)

    conn = sqlite3.connect(str(DB_PATH))
    try:
        conn.execute("PRAGMA foreign_keys = ON")

        existing_fk = conn.execute(
            "PRAGMA foreign_key_list(invoices)"
        ).fetchall()

        if existing_fk:
            print("Bang invoices da co khoa ngoai, khong chuyen doi.")
            return

        invalid = conn.execute("""
            SELECT i.id
            FROM invoices AS i
            LEFT JOIN customers AS c ON i.customer_id = c.id
            LEFT JOIN services AS s ON i.service_id = s.id
            WHERE c.id IS NULL OR s.id IS NULL
        """).fetchall()

        if invalid:
            raise RuntimeError(
                f"Co hoa don tham chieu sai: {invalid}"
            )

        old_count = conn.execute(
            "SELECT COUNT(*) FROM invoices"
        ).fetchone()[0]

        conn.execute("BEGIN IMMEDIATE")

        conn.execute("""
            CREATE TABLE invoices_new (
                id INTEGER NOT NULL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                total_amount NUMERIC(12, 2) NOT NULL,
                payment_method VARCHAR(30) NOT NULL,
                status VARCHAR(30) NOT NULL,
                notes TEXT,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (service_id) REFERENCES services(id)
            )
        """)

        conn.execute("""
            INSERT INTO invoices_new (
                id, customer_id, service_id,
                total_amount, payment_method,
                status, notes, created_at
            )
            SELECT
                id, customer_id, service_id,
                total_amount, payment_method,
                status, notes, created_at
            FROM invoices
        """)

        new_count = conn.execute(
            "SELECT COUNT(*) FROM invoices_new"
        ).fetchone()[0]

        if old_count != new_count:
            raise RuntimeError("So luong hoa don khong khop")

        conn.execute("DROP TABLE invoices")
        conn.execute("ALTER TABLE invoices_new RENAME TO invoices")

        errors = conn.execute(
            "PRAGMA foreign_key_check"
        ).fetchall()

        if errors:
            raise RuntimeError(
                f"Loi khoa ngoai: {errors}"
            )

        conn.commit()

        print("Chuyen doi thanh cong")
        print("So hoa don giu nguyen:", new_count)
        print(
            "Khoa ngoai:",
            conn.execute(
                "PRAGMA foreign_key_list(invoices)"
            ).fetchall()
        )

    except Exception:
        conn.rollback()
        print("Da huy giao dich do co loi")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
