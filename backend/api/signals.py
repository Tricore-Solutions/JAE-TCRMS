import bcrypt
from django.db.models.signals import post_migrate


def seed_default_admin(sender, **kwargs):
    from api.models import User

    if User.objects.exists():
        return

    password_hash = bcrypt.hashpw(b'admin123', bcrypt.gensalt(rounds=10)).decode('utf-8')
    User.objects.create(
        username='admin',
        password_hash=password_hash,
        full_name='System Administrator',
        role='admin',
    )
    print('Default admin account created. Username: admin / Password: admin123')
    print('IMPORTANT: Change the default password after first login.')
