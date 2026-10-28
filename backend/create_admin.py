from getpass import getpass

from sqlalchemy import select

from database import SessionLocal
from models import User
from auth_api import hash_password


def main():
    db = SessionLocal()

    try:
        existing_admin = db.scalar(
            select(User).where(User.role == "admin")
        )

        if existing_admin:
            print("He thong da co tai khoan Admin.")
            return

        print("=== TAO TAI KHOAN ADMIN ===")

        username = input("Ten dang nhap: ").strip()
        full_name = input("Ho va ten: ").strip()
        password = getpass("Mat khau (toi thieu 8 ky tu): ")

        if len(username) < 3:
            print("Ten dang nhap phai co it nhat 3 ky tu.")
            return

        if len(full_name) < 2:
            print("Ho va ten phai co it nhat 2 ky tu.")
            return

        if len(password) < 8:
            print("Mat khau phai co it nhat 8 ky tu.")
            return

        existing_user = db.scalar(
            select(User).where(User.username == username)
        )

        if existing_user:
            print("Ten dang nhap da ton tai.")
            return

        admin = User(
            username=username,
            password_hash=hash_password(password),
            full_name=full_name,
            role="admin",
            is_active=1
        )

        db.add(admin)
        db.commit()

        print("Tao tai khoan Admin thanh cong!")

    except Exception as error:
        db.rollback()
        print("Co loi:", error)

    finally:
        db.close()


if __name__ == "__main__":
    main()