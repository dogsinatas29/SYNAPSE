from board import Board
"""
login.py
Authentication logic for SYNAPSE
"""

class AuthProvider:
    def __init__(self):
        self.is_authenticated = False

    def login(self, username, password):
        # TODO: Implement real auth
        if username == "admin" and password == "synapse":
            self.is_authenticated = True
            return True
        return False

    def logout(self):
        self.is_authenticated = False

def validate_token(token):
    return token == "valid_token"
