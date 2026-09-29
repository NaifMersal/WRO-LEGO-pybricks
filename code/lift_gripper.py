"""lift_gripper.py -- jaws that GRIP an object, then LIFT it.  Port C.

    import movements as move          # named, like every import in the library
    import lift_gripper as lift       # named, NEVER star-imported

    lift.home()                       # shut on nothing = zero, then open ready
    lift.grab()                       # squeeze, then raise
    lift.release()                    # set down and open all the way
    lift.release(50)                  # ...or set down and open only THIS far

ONE MOTOR, ONE CONTINUOUS MOVE, TWO OUTCOMES. The jaws close until the object
stops them. Keep turning the same way and the jaws can't move any more -- so
the frame levers up around them instead, and the object rides up with it.

    +120 ........ contact ........ 0 ....... contact - LIFT_TRAVEL
    open, ready   object grips     jaws met  UP and carrying
                  VARIES BY SIZE   on air

PHASE 1 IS TORQUE, PHASE 2 IS ANGLE -- AND PHASE 2 COUNTS FROM CONTACT, NOT
FROM ZERO. A big base stops the jaws at +45, a small one at +20; an absolute
lift target would swing them to different heights. LIFT_TRAVEL is degrees
*past contact*, so every object rises the same amount.

POSITIVE OPENS, and zero is where the jaws MEET. claw_gripper.py counts the
OTHER way (zero at its open stop, positive closes) -- check which file you
are in before you flip a sign.
"""

from pybricks.parameters import Direction, Port, Stop
from pybricks.pupdevices import Motor
from pybricks.tools import wait


# ============================================================ LIFT FACTS ==

# EVERY NUMBER BELOW IS AT THE MOTOR, NOT AT THE JAWS. Measure the motor's
# number with the mechanism on the robot; the gearing cancels out.

LIFT_PORT = Port.C      # claw_gripper defaults to E, so both fit at once
LIFT_DIRECTION = Direction.COUNTERCLOCKWISE   # POSITIVE must mean OPENING  TUNE

OPEN_SPEED = 300        # deg/s
CLOSE_SPEED = 200       # deg/s -- slow enough not to slam the object
LIFT_SPEED = 150        # deg/s -- slowest: it is carrying now

HOME_EFFORT = 50        # % raw power, home() only. Too high strips gears.  TUNE
SQUEEZE_TORQUE = 60     # mNm -- phase 1 squeeze. High crushes, low slips.  TUNE
LIFT_TORQUE = 200       # mNm -- phase 2. MUST exceed SQUEEZE_TORQUE or the
                        # lift can never push past its own grip.            TUNE

READY_ANGLE = 140       # deg open -- wide enough for your BIGGEST object.  TUNE
CLOSE_TARGET = -10      # deg past shut. Unreachable on purpose: the jaws never
                        # arrive, so they never stop leaning in.

LIFT_TRAVEL = 60        # deg PAST CONTACT -- the lift itself. Not a position:
                        # raise until the object clears the mat.            TUNE


# ============================================================== HARDWARE ==

lift = Motor(LIFT_PORT, LIFT_DIRECTION)


# ================================================================= VERBS ==

def home():
    """Shut the jaws on NOTHING, call that zero, then open ready. Every run.

    The motor counts from wherever it was switched on, so after a crash or a
    battery swap that zero is garbage. Jaws meeting each other is a rigid stop
    that never lies -- and it costs no measuring at all.
    """
    lift.run_until_stalled(-CLOSE_SPEED, then=Stop.COAST,
                           duty_limit=HOME_EFFORT)
    wait(200)                       # let it settle, or zero drifts
    lift.reset_angle(0)
    lift.run_target(OPEN_SPEED, READY_ANGLE, then=Stop.COAST)


def grab():
    """Squeeze the object, then lift it."""
    # PHASE 1 -- TORQUE. Aim past shut so we never arrive; lean in at
    # SQUEEZE_TORQUE until the object stops us. One behaviour, any object.
    lift.control.limits(torque=SQUEEZE_TORQUE)
    lift.run_target(CLOSE_SPEED, CLOSE_TARGET, then=Stop.HOLD, wait=False)
    wait(100)                          # let it get moving before asking
    while not lift.stalled() and not lift.done():
        wait(10)

    contact = lift.angle()             # THE DATUM. Only phase 1 can know it.

    # PHASE 2 -- ANGLE, relative to contact. The jaws are clamped, so this
    # travel levers the frame up instead. Needs more torque than the grip it
    # has to push past. Stop.HOLD is load-bearing: one motor holds BOTH the
    # squeeze and the height, and the limit stays high so it doesn't sag.
    #
    # NOT run_angle(). It is relative to the CONTROLLER'S REFERENCE, not to
    # angle(), and while we are squeezing those differ by the squeeze itself.
    lift.control.limits(torque=LIFT_TORQUE)
    lift.run_target(LIFT_SPEED, contact - LIFT_TRAVEL, then=Stop.HOLD)


def release(angle=READY_ANGLE):
    """Set the object down and open the jaws. A smaller angle opens less.

    Zero is where the jaws meet, so the number is how far open you want
    them when the object is on the mat.
    """
    # +LIFT_TRAVEL walks the lift back off, landing near the contact point
    # whatever it was -- so this never needs to remember where the grip
    # stopped. "Near" is fine: the next move is an absolute one, so any slop
    # from the hold is wiped out rather than accumulated.
    lift.run_target(LIFT_SPEED, lift.angle() + LIFT_TRAVEL, then=Stop.HOLD)
    lift.run_target(OPEN_SPEED, angle, then=Stop.COAST)
