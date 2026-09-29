"""movements.py -- how your robot DRIVES. Wheels and the eye, nothing else.

    import movements as move       # named, like every import in the library

    move.robot.reset(angle=0)
    move.drive_straight(300)
    move.robot.turn(90, absolute=True)
    move.find_line()

RULES OF THE ROAD
    distances in mm         drive_straight(300) = 30 cm
    speeds in mm/s          drive_straight(300, speed=150)
    by, or to               robot.turn(90) spins 90 MORE.
                            robot.turn(90, absolute=True) FACES 90.

    Same idea as the claw: run_angle moves BY, run_target moves TO. One pair of
    words, two places on the robot.

ONE ZERO
    absolute=True aims at the zero robot.reset() set. Only TWO verbs move that
    zero, and both do it on purpose, because they just learnt the truth from the
    mat: wall_square() and square_on_line(). Nothing else may touch it -- a verb
    that moved the zero as a side effect would leave every later turn aiming at
    the wrong place, which is the bug that cost cohort 1 a fortnight.

    Both spend robot.reset(angle=h), which ALSO zeroes the distance odometer and
    stops the wheels. That is why every hunting verb below remembers its own
    start = robot.distance() instead of resetting.

THE VERBS THAT RUN THE ANCHOR
    drive_straight(mm)    forward, or backward if mm is negative
    find_line()           creep until the eye finds a line -- CHECK what it returns
    follow_line(mm)       ride the edge of the line this far (kd= for the PD stretch)
    drive_to_wall()       creep until the wheels stall on the border
    wall_square(h)        square up on the border and declare the heading
    square_on_line(h)     square up on a line and declare the heading -- TWO EYES

    Turning and heading are Pybricks' own: robot.turn() and robot.angle().
    show_eye() doesn't move the robot -- it lets you SEE what it thinks, which is
    how you tune. The two colour verbs at the foot of the file are STRETCH -- you
    score ~135 without ever naming a colour.

Everything you might change is in ROBOT FACTS, at the top.
Why any of this: docs/library-design-notes.md #1, #7, #8.
"""

from pybricks.hubs import PrimeHub
from pybricks.parameters import Color, Direction, Port   # Color re-exported, so
from pybricks.pupdevices import ColorSensor, Motor       # missions can say
from pybricks.robotics import DriveBase                  # find_color(Color.RED)
from pybricks.tools import StopWatch, wait


# =========================================================== ROBOT FACTS ==
# Measure these on YOUR robot. The numbers below are the coach's -- yours differ.

LEFT_MOTOR_PORT = Port.F        # yours
RIGHT_MOTOR_PORT = Port.B       # yours
EYE_PORT = Port.D               # yours

SECOND_EYE_PORT = None          # Port.A buys square_on_line(). None = one eye.

LEFT_DIRECTION = Direction.COUNTERCLOCKWISE   # flip if it drives backward  TUNE
RIGHT_DIRECTION = Direction.CLOCKWISE                                      # TUNE

WHEEL_DIAMETER = 88     # mm -- roll 5 turns, measure, divide by 5 x 3.14   TUNE
AXLE_TRACK = 128        # mm -- between the two wheel contact patches       TUNE

CRUISE_SPEED = 300      # mm/s -- normal driving                            TUNE
SLOW_SPEED = 100        # mm/s -- hunting for a line or a colour             TUNE
LINE_SPEED = 120        # mm/s -- while following a line                     TUNE

LINE_THRESHOLD = 50     # halfway between your black and white readings     TUNE
KP_LINE = 1.2           # how hard to steer back to the line                TUNE

SEARCH_MM = 400         # how far to hunt before giving up                  TUNE

WALL_SPEED = 60         # mm/s -- slow, so the stall is a nudge not a crash  TUNE
WALL_SETTLE_MS = 300    # ms of push after the stall, to sit flat            TUNE
WALL_TIMEOUT_MS = 6000  # ms -- give up even if the odometer froze            TUNE
SQUARE_TURN_RATE = 25   # deg/s -- pivot speed while hunting the second eye  TUNE
MAX_SQUARE_TURN = 45    # deg -- give up if the pivot can't find the line    TUNE
EYE_IS_ON_THE_LEFT = True   # is `eye` the LEFT eye of the pair? Get this
                            # wrong and square_on_line pivots AWAY from the
                            # line every time. Swap it and re-run.       TUNE


# ============================================================== HARDWARE ==

hub = PrimeHub()                          # for the speaker, the display, the button
left_motor = Motor(LEFT_MOTOR_PORT, LEFT_DIRECTION)
right_motor = Motor(RIGHT_MOTOR_PORT, RIGHT_DIRECTION)
eye = ColorSensor(EYE_PORT)
second_eye = ColorSensor(SECOND_EYE_PORT) if SECOND_EYE_PORT is not None else None

robot = DriveBase(left_motor, right_motor, WHEEL_DIAMETER, AXLE_TRACK)
robot.use_gyro(True)                      # the gyro keeps us straight
robot.settings(straight_speed=CRUISE_SPEED)


# ========================================================= DRIVING VERBS ==

def drive_straight(distance_mm, speed=CRUISE_SPEED):
    """Drive straight. Negative distance = backward."""
    robot.settings(straight_speed=speed)
    robot.straight(distance_mm)


# ======================================================== FINDING THE MAT ==
# Everything ABOVE this line adds error. Everything below it takes error away.

def find_line(max_mm=SEARCH_MM, speed=SLOW_SPEED):
    """Creep forward until the eye sees a line. True if found -- always check it."""
    start = robot.distance()      # remember the odometer; do NOT robot.reset()
    robot.drive(speed, 0)
    while abs(robot.distance() - start) < max_mm:
        if eye.reflection() < LINE_THRESHOLD:
            robot.stop()
            return True
        wait(5)
    robot.stop()
    return False


def follow_line(distance_mm, speed=LINE_SPEED, kd=0):
    """Ride the EDGE of the line for a distance. One eye follows edges, not middles.

    kd=0 is the P follower you gated on. Raise it for the PD upgrade.
    """
    start = robot.distance()      # remember the odometer; do NOT robot.reset()
    last_error = 0
    while abs(robot.distance() - start) < abs(distance_mm):
        error = eye.reflection() - LINE_THRESHOLD
        robot.drive(speed, KP_LINE * error + kd * (error - last_error))
        last_error = error
        wait(10)
    robot.stop()


# ============================================================== RESETTING ==
# The motors are the touch sensor. We have no distance sensor and don't need one.

def drive_to_wall(max_mm=SEARCH_MM, speed=WALL_SPEED):
    """Creep forward until the wheels stall on the border. True if we hit it.

    Bounded twice on purpose. Distance is the honest limit; the clock is the
    one that saves you, because a wheel held hard against the border stops
    turning -- robot.distance() freezes, and a loop watching only the odometer
    would push into that wall until the battery gave out.
    """
    start = robot.distance()      # remember the odometer; do NOT robot.reset()
    clock = StopWatch()
    give_up_ms = WALL_TIMEOUT_MS
    robot.drive(speed, 0)
    while abs(robot.distance() - start) < max_mm and clock.time() < give_up_ms:
        if robot.stalled():
            robot.stop()
            return True
        wait(10)
    robot.stop()
    return False


def wall_square(heading=0, max_mm=SEARCH_MM):
    """Push flat against the border, then declare which way that border faces.

    Both wheels press the same wall, so the robot ends parallel to it. THAT is
    the reset: the wall knows the angle even when the gyro has drifted.
    """
    if not drive_to_wall(max_mm):
        return False              # never learnt the angle -- do NOT declare one
    robot.use_gyro(False)         # the gyro HOLDS a heading; squaring needs the
    robot.drive(WALL_SPEED, 0)    # body free to swing until both wheels are flat
    wait(WALL_SETTLE_MS)
    robot.stop()
    robot.use_gyro(True)
    robot.reset(angle=heading)    # the wall knew the angle all along
    return True


def square_on_line(heading=0, max_mm=SEARCH_MM):
    """Sit square on a line, then declare which way it runs. NEEDS A SECOND EYE.

    Creep until one eye finds the line, then pivot until the other one does --
    when both eyes are on it, the robot is square to it.

    One eye cannot do this: one reading tells you that you ARE on the line, never
    whether you are crooked on it. A one-eye robot resets on a wall instead. That
    is what port A costs and buys.
    """
    if second_eye is None:
        raise ValueError("square_on_line needs SECOND_EYE_PORT -- use wall_square()")

    # Creep until EITHER eye finds the line. Whichever one missed is the one we
    # then hunt, so we can't use find_line() here -- it only watches one eye.
    start = robot.distance()      # remember the odometer; do NOT robot.reset()
    robot.drive(SLOW_SPEED, 0)
    hunting = None
    while hunting is None:
        if eye.reflection() < LINE_THRESHOLD:
            hunting = second_eye   # `eye` arrived, so the OTHER one is lagging
        elif second_eye.reflection() < LINE_THRESHOLD:
            hunting = eye
        elif abs(robot.distance() - start) >= max_mm:
            robot.stop()
            return False
        else:
            wait(5)
    robot.stop()                  # remember WHICH eye arrived before we coast:
                                  # stop() lets the wheels roll on, and the eye
                                  # that found the line can roll straight off it
    # Pivot the lagging side forward until its eye lands on the line too.
    pivot_start = robot.angle()
    lagging_is_right = (hunting is second_eye) == EYE_IS_ON_THE_LEFT
    robot.drive(0, SQUARE_TURN_RATE if lagging_is_right else -SQUARE_TURN_RATE)
    while hunting.reflection() >= LINE_THRESHOLD:
        if abs(robot.angle() - pivot_start) >= MAX_SQUARE_TURN:
            robot.stop()         # crooked past rescue, or the line ran out
            return False
        wait(5)
    robot.stop()
    robot.reset(angle=heading)
    return True


# ============================================================ CALIBRATION ==

def show_eye():
    """Print what the eye sees. Move the robot by hand, on the REAL mat.

    White -> write the number down. The line -> write that down.
    LINE_THRESHOLD goes halfway between.
    """
    while True:
        print("reflection:", eye.reflection(), "  colour:", eye.color())
        wait(500)


# ================================================================ STRETCH ==
#   NOTHING BELOW THIS LINE IS NEEDED FOR THE ANCHOR RUN.
# ~135 points -- instruments, cables, bonus-by-avoidance, microphone -- without
# ever naming a colour. Reflection barely moves; colour depends on the bulbs
# above the table. Lock the run above the line first. These two are for the
# fixed green/red notes (D24). Why: library-design-notes.md #7.

def find_color(wanted, max_mm=SEARCH_MM, speed=SLOW_SPEED):
    """Creep forward until the eye sees this colour -- find_color(Color.RED).

    Run show_eye() on the real mat under the real lights before trusting this.
    """
    start = robot.distance()      # remember the odometer; do NOT robot.reset()
    robot.drive(speed, 0)
    while abs(robot.distance() - start) < max_mm:
        if eye.color() == wanted:
            robot.stop()
            return True
        wait(5)
    robot.stop()
    return False


def follow_line_to_color(wanted, max_mm=SEARCH_MM, speed=LINE_SPEED):
    """Follow the line until the eye lands on a colour. True if we got there.

    Better than a fixed distance: the colour tells you that you ARRIVED, so a
    bit of wheel slip costs you nothing.
    """
    start = robot.distance()      # remember the odometer; do NOT robot.reset()
    while abs(robot.distance() - start) < max_mm:
        if eye.color() == wanted:
            robot.stop()
            return True
        error = eye.reflection() - LINE_THRESHOLD
        robot.drive(speed, KP_LINE * error)
        wait(10)
    robot.stop()
    return False
