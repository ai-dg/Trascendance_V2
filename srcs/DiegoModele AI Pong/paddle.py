from server.logging import logger

class Paddle:
    def __init__(self, data, user, ball=None, scene=None, side="left"):
        self.user = user
        self.data = data
        self.ball = ball
        self.scene = scene
        field = ""
        if side == "left":
            field = 'player_x'
        else:
            field = 'player2_x'
            
        self.x = data[field]
        self.y = data['player_y']
        self.width = data['player_width']
        self.height = data['player_height']
        self.speed = data['player_speed']
        self.direction = 0

    def set_direction(self, value):
        self.direction = value

    def move(self, canvas_height):
        self.y += self.direction * self.speed

        if self.y < 0:
            self.y = 0
        elif self.y + self.height > canvas_height:
            self.y = canvas_height - self.height

    def reset(self):
        self.y = self.data['player_y']
        self.direction = 0

    def to_dict(self):
        return {
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height
        }
