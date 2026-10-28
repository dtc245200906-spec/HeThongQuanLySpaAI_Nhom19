from database import Base, engine
from models import Customer, Service, Appointment, Employee, Invoice

Base.metadata.create_all(bind=engine)

print("Da khoi tao co so du lieu Spa AI thanh cong!")