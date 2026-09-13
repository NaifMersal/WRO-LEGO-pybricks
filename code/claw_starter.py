from pybricks.parameters import Direction, Port, Stop
from pybricks.pupdevices import Motor
from pybricks.tools import wait

CLAW_PORT = Port.E
CLAW_DIRECTION = Direction.CLOCKWISE
OPEN_SPEED = 300
CLOSE_SPEED = 200
OPEN_TARGET = 0
GRIP_TARGET = 130
HOME_TORQUE = 220
GRIP_TORQUE = 180

claw = Motor(CLAW_PORT, CLAW_DIRECTION)


def home():
    claw.control.limits(torque=HOME_TORQUE)
    claw.run_until_stalled(
        -CLOSE_SPEED,
        then=Stop.COAST
    )

    wait(200)
    claw.reset_angle(0)

    claw.control.limits(torque=GRIP_TORQUE)
