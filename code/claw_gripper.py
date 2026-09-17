"""claw_gripper.py -- a claw that closes on the object.  Port E.

    import claw_gripper as claw

    claw.home()          # find the open end stop, zero there, stay at 0 deg
    claw.grab()          # move toward 120 deg; keep pressing if blocked
    claw.release()       # return to the 0 deg opening
    claw.release(50)     # target 50 deg: less open than the default 0 deg

ZERO IS AT THE OPEN END STOP. Positive rotation closes this claw; negative
rotation opens it. home() finds that stop with the jaws empty and calls it 0.

All angles are motor-shaft degrees from that zero, not jaw angles or gap widths.
Larger targets close the jaws farther; smaller targets open them farther.

    0 = OPEN_TARGET .................. GRIP_TARGET (120)
    open stop / release                closing target

An object may stop the jaws before the grip target. The motor keeps trying
to reach that target, with its torque limited. If it reaches the target,
it holds that angle instead. Neither outcome alone confirms a successful catch.
"""

from pybricks.parameters import Direction, Port, Stop
from pybricks.pupdevices import Motor
from pybricks.tools import wait


# ============================================================ CLAW FACTS ==

CLAW_PORT = Port.E
CLAW_DIRECTION = Direction.CLOCKWISE   # Positive closes; negative opens. TUNE

OPEN_SPEED = 300        # motor deg/s -- move to the release target
CLOSE_SPEED = 200       # motor deg/s -- also used to approach the open home stop

HOME_TORQUE = 220       # mNm -- homing torque limit at the rigid open stop TUNE
GRIP_TORQUE = 180       # mNm -- gripping and opening torque limit          TUNE

OPEN_TARGET = 0        # motor deg from open zero -- default release position TUNE
GRIP_TARGET = 120       # motor deg from open zero -- closing target          TUNE
                       # An object may block it; reaching it is also allowed.
                       # Keep it short of the angle where empty jaws meet, or
                       # every empty grab ends by jamming the jaws together.


# ============================================================== HARDWARE ==

claw = Motor(CLAW_PORT, CLAW_DIRECTION)
claw.control.limits(torque=GRIP_TORQUE)


# ================================================================= VERBS ==

def home():
    """With empty jaws, find the open stop and zero there."""
    claw.control.limits(torque=HOME_TORQUE)
    claw.run_until_stalled(-CLOSE_SPEED, then=Stop.COAST)
    wait(200)                       # let the mechanism settle before setting zero
    claw.reset_angle(0)
    claw.control.limits(torque=GRIP_TORQUE)


def grab():
    """Move toward GRIP_TARGET; return when stalled or when the movement is done."""
    claw.control.limits(torque=GRIP_TORQUE)
    claw.run_target(CLOSE_SPEED, GRIP_TARGET, then=Stop.HOLD, wait=False)
    wait(100)                       # allow movement to start before checking status
    while not claw.stalled() and not claw.done():
        wait(10)
    # Keep the command active: press toward a blocked target, or hold a reached one.


def release(angle=OPEN_TARGET):
    """Move to a release position, then let the motor coast.

    The target is motor-shaft degrees from the open end stop. The default
    is 0 deg; release(50) leaves the jaws less open than that default.
    A larger target can reduce the opening sweep, but must still let the
    object go. run_target moves to the requested angle from either direction.
    """
    claw.control.limits(torque=GRIP_TORQUE)
    claw.run_target(OPEN_SPEED, angle, then=Stop.COAST)
