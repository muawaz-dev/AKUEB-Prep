// One-off import of "Physics Model Paper XI (Paper-I).pdf" (AKU-EB Model
// Paper 2026) into the question bank. Looks up Chapter/Topic/Slo by the
// codes already seeded via akueb_hssc1_physics_slo.csv (see seed.ts) rather
// than re-deriving them, so a typo here fails loudly instead of silently
// creating a duplicate/orphan Chapter or Topic.
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Difficulty } from "../app/generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type QuestionDef = {
  chapterTitle: string;
  topicCode: string;
  sloCode: string;
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  difficulty: Difficulty;
  // Set for questions whose figure is essential to answering them - the
  // admin will attach the actual image later (see conversation instructions).
  needsImage?: boolean;
};

const PAST_PAPER = "AKU-EB Model Paper 2026";
const CLASS_LEVEL = 11;
const SUBJECT = "Physics";

const QUESTIONS: QuestionDef[] = [
  {
    chapterTitle: "Physical Quantities and Measurement",
    topicCode: "1.2",
    sloCode: "1.2.4",
    prompt: "The dimensions of momentum are represented as",
    choices: ["$[ML^2T^{-1}]$", "$[MLT^{-1}]$", "$[MLT^{-2}]$", "$[ML^{-1}T]$"],
    correctIndex: 1,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Physical Quantities and Measurement",
    topicCode: "1.4",
    sloCode: "1.4.2",
    prompt:
      "Uncertainty in measurement can occur due to the\n\nI. limitation of instruments\nII. natural variations\nIII. frequent errors",
    choices: ["I only", "III only", "I and II", "II and III"],
    correctIndex: 2,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Scalars and Vectors",
    topicCode: "2.3",
    sloCode: "2.3.3",
    prompt: "If the dot product of two vectors ($X$ and $Y$) is zero, then which of the following conditions is TRUE?",
    choices: [
      "Both vectors are parallel to each other",
      "Both vectors are opposite to each other",
      "Either of the two vectors is a unit vector",
      "Either of the two vectors is a null vector",
    ],
    correctIndex: 3,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Scalars and Vectors",
    topicCode: "2.4",
    sloCode: "2.4.2",
    prompt:
      "The cross product of two vectors ($X$ and $Y$) is directed opposite to the reference direction when the angle between them is",
    choices: ["$0°$", "$90°$", "$180°$", "$270°$"],
    correctIndex: 3,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Motion in One Dimension",
    topicCode: "3.2",
    sloCode: "3.2.2",
    prompt: "The law of conservation that is used in the propulsion of rockets is",
    choices: ["heat", "mass", "energy", "momentum"],
    correctIndex: 3,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Motion in One Dimension",
    topicCode: "3.2",
    sloCode: "3.2.3",
    prompt:
      "A moving car crashes into a stack of sandbags. It hits the sandbags and passes through them.\n\nWhen the car hits the sandbags, the total momentum of the car",
    choices: ["increases", "decreases", "becomes zero", "remains the same"],
    correctIndex: 1,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Motion in One Dimension",
    topicCode: "3.1",
    sloCode: "3.1.2",
    prompt:
      "An object falls freely from rest. The total distance covered by it in 2 s will be\n\n(Note: The acceleration due to gravity 'g' is $9.8\\ m/s^2$.)",
    choices: ["9.8 m", "19.6 m", "29.4 m", "39.2 m"],
    correctIndex: 1,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Motion in One Dimension",
    topicCode: "3.2",
    sloCode: "3.2.5",
    prompt:
      "A lighter metallic ball ($m_1$) collides with a much heavier metallic ball ($m_2$) which is at rest, and ($m_1 \\ll m_2$), then after an elastic collision, the heavier ball ($m_2$) will",
    choices: [
      "remain at rest",
      "gain the lighter ball's velocity",
      "move in the opposite direction",
      "move with double the velocity of the lighter ball",
    ],
    correctIndex: 0,
    difficulty: "HARD",
  },
  {
    chapterTitle: "Motion in One Dimension",
    topicCode: "3.4",
    sloCode: "3.4.1",
    prompt: "In a conservative field, the work done in moving a body around a closed loop is always",
    choices: [
      "zero",
      "negative",
      "dependent on the shape of the loop",
      "dependent on the length of the path",
    ],
    correctIndex: 0,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Motion in One Dimension",
    topicCode: "3.5",
    sloCode: "3.5.2",
    prompt:
      "A moving truck applies brakes and stops after traveling 20 m. If its kinetic energy was 4000 J, then the average braking force will be",
    choices: ["200 N", "3980 N", "4020 N", "80000 N"],
    correctIndex: 0,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Motion in Two Dimensions",
    topicCode: "4.1",
    sloCode: "4.1.2",
    prompt:
      "The given figure shows the first attempt of a long jump of an athlete in Olympics.\n\nWhich of the following factors of the athlete will MAINLY help him to improve his own record in the next attempt?",
    choices: [
      "Angle of projection of the athlete",
      "Acceleration of the athlete",
      "Body shape of the athlete",
      "Weight of the athlete",
    ],
    correctIndex: 0,
    difficulty: "MEDIUM",
    needsImage: true,
  },
  {
    chapterTitle: "Motion in Two Dimensions",
    topicCode: "4.1",
    sloCode: "4.1.3",
    prompt:
      "Missiles I, II, III and IV are launched at $35°$, $45°$, $55°$ and $65°$, respectively from the launching pad with same initial velocity.\n\nThe shortest distance will be covered by",
    choices: ["Missile I", "Missile II", "Missile III", "Missile IV"],
    correctIndex: 3,
    difficulty: "HARD",
  },
  {
    chapterTitle: "Motion in Two Dimensions",
    topicCode: "4.3",
    sloCode: "4.3.1",
    prompt: "When an object moves with uniform speed in a circular orbit, its centripetal acceleration will be directed",
    choices: [
      "along the circumference of the circle",
      "along the direction of motion of the object",
      "towards the centre of the circle along the radius",
      "away from the centre of the circle along the radius",
    ],
    correctIndex: 2,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Motion in Two Dimensions",
    topicCode: "4.5",
    sloCode: "4.5.4",
    prompt: "In all of the following sports, the law of conservation of angular momentum is used EXCEPT in",
    choices: ["ice-skating", "gymnastics", "horse riding", "board diving"],
    correctIndex: 2,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Motion in Two Dimensions",
    topicCode: "4.3",
    sloCode: "4.3.1",
    prompt:
      "The acceleration produced by virtue of changing direction of velocity of an object moving in a circular path is called",
    choices: ["average acceleration", "tangential acceleration", "centripetal acceleration", "instantaneous acceleration"],
    correctIndex: 2,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Motion in Two Dimensions",
    topicCode: "4.1",
    sloCode: "4.1.2",
    prompt:
      "The given diagram shows the projectile motion of a ball, with points A, B, C and D marked along its path.\n\nConsidering the given situation, the magnitude of the vertical component of velocity will be maximum at point",
    choices: ["A", "B", "C", "D"],
    correctIndex: 3,
    difficulty: "HARD",
    needsImage: true,
  },
  {
    chapterTitle: "Motion in Two Dimensions",
    topicCode: "4.2",
    sloCode: "4.2.1",
    prompt:
      "The direction of the angular acceleration of a body is always\n\nI. along the axis of rotation\nII. along the tangent to the path\nIII. perpendicular to the axis of rotation",
    choices: ["I only", "III only", "I and II", "II and III"],
    correctIndex: 0,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Deformation in Solids",
    topicCode: "5.4",
    sloCode: "5.4.3",
    prompt:
      "A copper wire of length 3 m and an area of $0.02\\ m^2$ is stretched by a force of 500 N.\n\nIf Young's modulus of the copper wire is $1.1 \\times 10^{11}\\ Pa$, then the elongation of the wire will be",
    choices: ["$7.5 \\times 10^{-8}\\ m$", "$6.8 \\times 10^{-7}\\ m$", "$1.4 \\times 10^{6}\\ m$", "$3.3 \\times 10^{12}\\ m$"],
    correctIndex: 1,
    difficulty: "HARD",
  },
  {
    chapterTitle: "Fluids Dynamics",
    topicCode: "6.4",
    sloCode: "6.4.3",
    prompt: "All of the following are applications of Bernoulli's effect EXCEPT",
    choices: ["aerofoil", "atomizer", "venturi meter", "vacuum cleaner"],
    correctIndex: 3,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Fluids Dynamics",
    topicCode: "6.2",
    sloCode: "6.2.1",
    prompt: "If each particle of a fluid passing through a point follows the same path, then this flow is called",
    choices: ["normal flow", "irregular flow", "turbulent flow", "streamline flow"],
    correctIndex: 3,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Fluids Dynamics",
    topicCode: "6.3",
    sloCode: "6.3.2",
    prompt:
      "According to the equation of continuity, if the cross-sectional area of a pipe decreases, then the speed of the fluid passing through it",
    choices: ["increases", "decreases", "remains the same", "varies unpredictably"],
    correctIndex: 0,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Fluids Dynamics",
    topicCode: "6.4",
    sloCode: "6.4.2",
    prompt: "The statement which is CORRECT with respect to the Bernoulli's theorem is that the",
    choices: [
      "speed of fluids is low at low pressure",
      "speed of fluids is high at low pressure",
      "pressure of a fluid is independent of its speed",
      "theorem is valid only for turbulent flow of a liquid",
    ],
    correctIndex: 1,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Oscillations",
    topicCode: "7.4",
    sloCode: "7.4.3",
    prompt:
      "A mass '$m$' is hanging on an inextensible string to make a simple pendulum of time period '$T$'.\n\nIf the mass becomes '$3m$', then the time period of the simple pendulum will be",
    choices: ["$\\dfrac{T}{3}$", "$T$", "$3T$", "$\\sqrt{3}\\,T$"],
    correctIndex: 1,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Oscillations",
    topicCode: "7.2",
    sloCode: "7.2.2",
    prompt:
      "A particle is moving in a circle with uniform speed, for which the projection of the particle is moving along the diameter of the circle.\n\nIn the given situation, the motion of projection is",
    choices: ["linear", "rotatory", "circulatory", "simple harmonic"],
    correctIndex: 3,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Oscillations",
    topicCode: "7.7",
    sloCode: "7.7.2",
    prompt:
      "Resonance is a phenomenon in which a vibrating system or external force drives another system to oscillate with greater amplitude at specific frequencies.\n\nThis phenomenon helps in determining the",
    choices: ["forced vibration", "natural frequency", "energy dissipation", "amplitude of a vibrating body"],
    correctIndex: 1,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Oscillations",
    topicCode: "7.6",
    sloCode: "7.6.1",
    prompt: "Loud music produced by beating a wooden drum is an example of",
    choices: ["beats", "free vibrations", "forced vibrations", "damped oscillations"],
    correctIndex: 1,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Oscillations",
    topicCode: "7.8",
    sloCode: "7.8.2",
    prompt:
      "When a car moves on any uneven surface, then its shock absorbers play an important role.\n\nThe working of shock absorbers exemplifies",
    choices: ["free oscillation", "force oscillation", "damped oscillation", "undamped oscillation"],
    correctIndex: 2,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Oscillations",
    topicCode: "7.5",
    sloCode: "7.5.3",
    prompt: "When the bob of a simple pendulum is at the mean position during oscillation, its kinetic energy will",
    choices: ["be zero", "be minimum", "be maximum", "remain constant"],
    correctIndex: 2,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Oscillations",
    topicCode: "7.3",
    sloCode: "7.3.3",
    prompt: "If a 0.5 kg mass is attached to a spring constant of 200 N/m, then the time period of oscillation will be",
    choices: ["0.05 s", "0.314 s", "20.0 s", "125.6 s"],
    correctIndex: 1,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Waves",
    topicCode: "8.1",
    sloCode: "8.1.2",
    prompt: "The option which is TRUE about the speed of wave on a string is that speed depends on the",
    choices: ["frequency", "amplitude", "mass per unit length of the string", "atmospheric conditions of the surrounding"],
    correctIndex: 2,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Waves",
    topicCode: "8.1",
    sloCode: "8.1.4",
    prompt: "If a wave has a frequency of 10 Hz, then the time period of the wave will be",
    choices: ["0.1 s", "1.0 s", "10 s", "100 s"],
    correctIndex: 0,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Waves",
    topicCode: "8.3",
    sloCode: "8.3.4",
    prompt:
      "When two tuning forks of nearly the same frequencies are sounded together, a note of alternately increasing and decreasing intensity will be heard.\n\nBased on the given description, the note is called",
    choices: ["beat", "waveform", "diffraction", "polarisation"],
    correctIndex: 0,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Waves",
    topicCode: "8.4",
    sloCode: "8.4.3",
    prompt:
      "One end closed pipe has a loudspeaker at its open end. A stationary sound wave is formed in the air within the pipe with an antinode at the open end of it, as shown in the given figure. The length of the pipe is 0.4 m.\n\n(Note: The speed of sound in air is 343 m/s.)\n\nThe frequency of sound that produces a stationary wave from the loudspeaker is",
    choices: ["214.4 Hz", "285.8 Hz", "428.8 Hz", "857.5 Hz"],
    correctIndex: 0,
    difficulty: "HARD",
    needsImage: true,
  },
  {
    chapterTitle: "Waves",
    topicCode: "8.5",
    sloCode: "8.5.2",
    prompt:
      "When a listener moves away from a stationary source of sound, then the apparent change in the pitch and frequency of sound for the listener is",
    choices: ["Pitch: low, Frequency: low", "Pitch: high, Frequency: low", "Pitch: low, Frequency: high", "Pitch: high, Frequency: high"],
    correctIndex: 0,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Waves",
    topicCode: "8.2",
    sloCode: "8.2.1",
    prompt: "The phenomenon of wave that distinguishes between transverse and longitudinal waves is",
    choices: ["refraction", "diffraction", "interference", "polarisation"],
    correctIndex: 3,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Waves",
    topicCode: "8.3",
    sloCode: "8.3.1",
    prompt: "The resultant displacement at any point due to the sum of displacements of two or more waves is called",
    choices: ["interference", "Doppler's effect", "Huygen's principle", "principle of superposition"],
    correctIndex: 3,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Physical Optics",
    topicCode: "9.6",
    sloCode: "9.6.6",
    prompt: "If the analyser is rotated from $0°$ to $90°$, then the transmitted intensity of polarised light will",
    choices: ["decrease to zero", "remain the same", "vary unpredictably", "increase to maximum"],
    correctIndex: 0,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Physical Optics",
    topicCode: "9.6",
    sloCode: "9.6.7",
    prompt: "Which of the following is NOT the application of polarisation of light?",
    choices: [
      "Photographers use filters to reduce the glare in order to get clear pictures",
      "Drivers use sunglasses that diminish the brightness of headlights of a car",
      "Astronomers use lenses in telescopes to enlarge the image of celestial bodies",
      "Fishermen use eye-wear which decreases the reflection of light from the water",
    ],
    correctIndex: 2,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Physical Optics",
    topicCode: "9.6",
    sloCode: "9.6.4",
    prompt: "The optical media that is used to eliminate the glare of light produced by the road surface during driving is",
    choices: ["sun screen", "convex lens", "plane mirror", "polaroid glass"],
    correctIndex: 3,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Physical Optics",
    topicCode: "9.2",
    sloCode: "9.2.2",
    prompt: "Colours seen from an oil film on water depends on the following factors EXCEPT",
    choices: ["angle of view", "density of the oil", "index of refraction", "thickness of the film"],
    correctIndex: 1,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Physical Optics",
    topicCode: "9.1",
    sloCode: "9.1.3",
    prompt: "According to Huygen's principle, light travels in the form of\n\nI. photons\nII. corpuscles\nIII. wavefronts",
    choices: ["I only", "III only", "I and II", "II and III"],
    correctIndex: 1,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Physical Optics",
    topicCode: "9.2",
    sloCode: "9.2.5",
    prompt:
      "In Young's double slits experiment, the relation used to find the position of the dark fringes is\n\n(Note: All the symbols have their usual meaning.)",
    choices: ["$Y = (m + 1)\\lambda L / d$", "$Y = (m - 1)\\lambda L / d$", "$Y = (m + 1/2)\\lambda L / d$", "$Y = (m - 1/2)\\lambda L / d$"],
    correctIndex: 2,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Physical Optics",
    topicCode: "9.3",
    sloCode: "9.3.1",
    prompt: "Michelson's interferometer is PRIMARLY used to measure",
    choices: ["velocity of light", "amplitude of light", "frequency of light", "wavelength of light"],
    correctIndex: 3,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Thermodynamics",
    topicCode: "10.9",
    sloCode: "10.9.3",
    prompt: "All Carnot engines have zero efficiency if they are operating between two bodies with",
    choices: [
      "the same temperature and the same nature of the working substance",
      "different temperatures and the same nature of the working substance",
      "the same temperature irrespective of the nature of the working substance",
      "different temperatures irrespective of the nature of the working substance",
    ],
    correctIndex: 2,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Thermodynamics",
    topicCode: "10.9",
    sloCode: "10.9.2",
    prompt: "The CORRECT sequence of the working principle of Carnot engine is",
    choices: [
      "Adiabatic compression → isothermal expansion → isobaric compression → isochoric expansion",
      "Isothermal expansion → isobaric compression → adiabatic compression → isochoric expansion",
      "Isothermal expansion → adiabatic expansion → isothermal compression → adiabatic compression",
      "Isobaric compression → isothermal expansion → isochoric expansion → adiabatic compression",
    ],
    correctIndex: 2,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Thermodynamics",
    topicCode: "10.2",
    sloCode: "10.2.1",
    prompt:
      "According to Boyle's law, volume is inversely proportional to pressure of a gas at constant\n\nI. mass\nII. density\nIII. temperature",
    choices: ["I only", "II only", "I and III", "II and III"],
    correctIndex: 2,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Thermodynamics",
    topicCode: "10.5",
    sloCode: "10.5.2",
    prompt:
      "A thermodynamics process in which an ice cube starts melting and converts into water droplets while keeping the temperature of its surrounding constant is called an",
    choices: ["isobaric process", "isochoric process", "adiabatic process", "isothermal process"],
    correctIndex: 3,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Thermodynamics",
    topicCode: "10.8",
    sloCode: "10.8.1",
    prompt: "According to the 2nd law of thermodynamics, heat can be converted into mechanical work if the system contains",
    choices: [
      "two heat reservoirs at the same temperature",
      "two heat reservoirs at different temperatures",
      "an engine and a heat reservoir at the same temperature",
      "an engine and two heat reservoirs at different temperatures",
    ],
    correctIndex: 3,
    difficulty: "MEDIUM",
  },
  {
    chapterTitle: "Thermodynamics",
    topicCode: "10.4",
    sloCode: "10.4.3",
    prompt: "In thermodynamics, when any two objects are rubbed together, then their internal energy will",
    choices: ["increase", "decrease", "become zero", "remain constant"],
    correctIndex: 0,
    difficulty: "EASY",
  },
  {
    chapterTitle: "Thermodynamics",
    topicCode: "10.7",
    sloCode: "10.7.1",
    prompt: "All of the following are the examples of reversible process EXCEPT",
    choices: [
      "boiling of raw eggs",
      "compression of a helical spring",
      "slow compression of oxygen gas",
      "freezing of a carbonated drink into ice",
    ],
    correctIndex: 0,
    difficulty: "MEDIUM",
  },
];

async function main() {
  const [cls, subject] = await Promise.all([
    prisma.class.findUniqueOrThrow({ where: { level: CLASS_LEVEL } }),
    prisma.subject.findFirstOrThrow({ where: { name: { equals: SUBJECT, mode: "insensitive" } } }),
  ]);

  let created = 0;
  for (const [i, q] of QUESTIONS.entries()) {
    const n = i + 1;
    const chapter = await prisma.chapter.findFirstOrThrow({
      where: { classId: cls.id, subjectId: subject.id, title: { equals: q.chapterTitle, mode: "insensitive" } },
    });
    const topic = await prisma.topic.findFirstOrThrow({
      where: { chapterId: chapter.id, code: q.topicCode },
    });
    const slo = await prisma.slo.findFirstOrThrow({
      where: { topicId: topic.id, code: q.sloCode },
    });

    await prisma.question.create({
      data: {
        classId: cls.id,
        subjectId: subject.id,
        chapterId: chapter.id,
        topicId: topic.id,
        sloId: slo.id,
        type: "MCQ",
        difficulty: q.difficulty,
        pastPaper: PAST_PAPER,
        prompt: q.prompt,
        data: { choices: q.choices, correctIndex: q.correctIndex },
        status: "DRAFT",
      },
    });
    created += 1;
    if (q.needsImage) {
      console.log(`  Q${n}: created (needs image - add via admin later)`);
    }
  }

  console.log(`Created ${created} MCQ questions from "${PAST_PAPER}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
