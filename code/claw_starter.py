from pybricks.parameters import Direction, Port, Stop
from pybricks.pupdevices import Motor
from pybricks.tools import wait

CLAW_PORT = Port.E
CLAW_DIRECTION = Direction.CLOCKWISE
CLAW_GEARS = [12, 20]  # motor gear, output gear
OPEN_SPEED = 180
CLOSE_SPEED = 120
OPEN_TARGET = 0
CLOSE_TARGET = 72
HOME_TORQUE = 220
SQUEEZE_TORQUE = 180

claw = Motor(port=CLAW_PORT, positive_direction=CLAW_DIRECTION, gears=CLAW_GEARS)


def home():
    claw.control.limits(torque=HOME_TORQUE)
    claw.run_until_stalled(
        -CLOSE_SPEED,
        then=Stop.COAST
    )

    wait(200)
    claw.reset_angle(0)

    claw.control.limits(torque=SQUEEZE_TORQUE)
