"""claw_gripper.py -- a claw that closes on the object.  Port E.

    import claw_gripper as claw

    claw.home()          # find the open end stop, zero there, stay at 0 deg
    claw.grab()          # move toward 72 output deg; keep pressing if blocked
    claw.release()       # return to the 0 deg opening
    claw.release(50)     # target 50 deg: less open than the default 0 deg
    claw.release(wait=False)  # start opening, then continue with driving

ZERO IS AT THE OPEN END STOP. Positive rotation closes this claw; negative
rotation opens it. home() finds that stop with the jaws empty and calls it 0.

All angles are output-axle degrees from that zero, not jaw gap widths.
Larger targets close the jaws farther; smaller targets open them farther.

    0 = OPEN_TARGET .................. CLOSE_TARGET (72)
    open stop / release                closing target

An object may stop the jaws before the grip target. The motor keeps trying
to reach that target, with its torque limited. If it reaches the target,
it holds that angle instead. Neither outcome alone confirms a successful catch.

grab() returns as soon as the squeeze passes CONTACT_LOAD, without waiting for
the push to reach SQUEEZE_TORQUE. The motor keeps pressing after it returns, so
the squeeze carries on rising to SQUEEZE_TORQUE while the robot drives.
"""

from pybricks.parameters import Direction, Port, Stop
from pybricks.pupdevices import Motor
from pybricks.tools import wait


# ============================================================ CLAW FACTS ==

CLAW_PORT = Port.E
CLAW_DIRECTION = Direction.CLOCKWISE   # Positive closes; negative opens. TUNE
CLAW_GEARS = [12, 20]  # motor axle gear, then jaw output gear. TUNE

OPEN_SPEED = 180          # output deg/s -- move to the release target
CLOSE_SPEED = 120         # output deg/s -- also used to approach the open home stop

HOME_TORQUE = 220         # mNm -- homing torque limit at the rigid open stop  TUNE
SQUEEZE_TORQUE = 180      # mNm -- how hard the jaws press for the whole carry TUNE
                          # (also caps release()). MUST exceed CONTACT_LOAD, or
                          # grab() never returns on an object.
CONTACT_LOAD = 100        # mNm -- grab() returns once the load passes this    TUNE
                          # Above the load of closing on air, below SQUEEZE_TORQUE:
                          # print(abs(claw.load())) while closing, empty and full.

OPEN_TARGET = 0           # output deg from open zero -- default release position TUNE
CLOSE_TARGET = 72         # output deg from open zero -- closing target           TUNE
                          # 120 motor deg * 12/20 = 72 output deg.
                          # An object may block it; reaching it is also allowed.
                          # Keep it short of the angle where empty jaws meet, or
                          # every empty grab ends by jamming the jaws together.


# ============================================================== HARDWARE ==

claw = Motor(port=CLAW_PORT, positive_direction=CLAW_DIRECTION, gears=CLAW_GEARS)
claw.control.limits(torque=SQUEEZE_TORQUE)


# ================================================================= VERBS ==

def home():
    """With empty jaws, find the open stop and zero there."""
    claw.control.limits(torque=HOME_TORQUE)
    claw.run_until_stalled(-CLOSE_SPEED, then=Stop.COAST)
    wait(200)                       # let the mechanism settle before setting zero
    claw.reset_angle(0)
    claw.control.limits(torque=SQUEEZE_TORQUE)


def grab():
    """Move toward CLOSE_TARGET; return once squeezing or when the movement is done."""
    claw.control.limits(torque=SQUEEZE_TORQUE)
    claw.run_target(CLOSE_SPEED, CLOSE_TARGET, then=Stop.HOLD, wait=False)
    wait(100)                       # allow movement to start before checking status
    # load() reads negative while closing; abs() makes the sign not matter.
    while abs(claw.load()) < CONTACT_LOAD and not claw.done():
        wait(10)
    # Keep the command active: press toward a blocked target, or hold a reached one.


def release(angle=OPEN_TARGET, wait=True):
    """Move to a release position, then let the motor coast.

    The target is output-axle degrees from the open end stop. The default
    is 0 deg; release(50) leaves the jaws less open than that default.
    A larger target can reduce the opening sweep, but must still let the
    object go. run_target moves to the requested angle from either direction.
    wait=False returns immediately while the motor keeps opening.
    """
    claw.control.limits(torque=SQUEEZE_TORQUE)
    claw.run_target(OPEN_SPEED, angle, then=Stop.COAST, wait=wait)
