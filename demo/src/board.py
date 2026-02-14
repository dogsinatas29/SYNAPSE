"""
board.py
Visualization board logic
"""

class CanvasManager:
    def __init__(self, size):
        self.size = size
        self.elements = []

    def add_element(self, element):
        self.elements.append(element)

    def clear(self):
        self.elements = []

def get_board_config():
    return {"theme": "gruvbox", "grid": True}
