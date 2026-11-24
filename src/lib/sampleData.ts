import type { CompletedGuide, Guide } from './types';

export const sampleGuides: Guide[] = [
  {
    id: 'g1',
    title: 'Change a Flat Tire Safely',
    description:
      'Learn how to replace a punctured tire with a spare, from parking safely to tightening the lug nuts in the right order.',
    category: 'Car Care',
    tags: ['roadside', 'beginner', 'safety'],
    totalSteps: 6,
    completedSteps: 2,
    updatedAt: 'Today',
    steps: [
      {
        id: 1,
        title: 'Park on flat, solid ground',
        instruction:
          'Pull over away from traffic and find a level, firm surface like concrete or asphalt. Avoid soft shoulders and hills. Turn on your hazard lights and apply the parking brake before doing anything else.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 2,
        title: 'Place wheel wedges and loosen the nuts',
        instruction:
          'Slide a wedge in front of (or behind) one of the intact tires so the car cannot roll. Then, while the car is still on the ground, use the wrench to loosen each lug nut about half a turn — counterclockwise. Do not remove them yet.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 3,
        title: 'Jack up the car',
        instruction:
          'Position the jack under the reinforced metal edge nearest the flat tire, then raise the car until the flat tire is roughly 15 cm (6 in) off the ground. Never put any part of your body under the vehicle while it is on the jack.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 4,
        title: 'Remove the flat and mount the spare',
        instruction:
          'Unscrew the loosened lug nuts completely and pull the flat tire straight toward you. Line the spare wheel up with the wheel bolts and push it on until it sits flush against the hub.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 5,
        title: 'Hand-tighten, lower, then torque the nuts',
        instruction:
          'Screw each lug nut on by hand, then lower the car until the tire just touches the ground. Tighten the nuts in a star pattern — top, left, bottom, right — with the wrench, so the wheel seats evenly.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 6,
        title: 'Check pressure and stow your tools',
        instruction:
          'Lower the car fully and give each nut one final firm turn. Check the spare tire pressure if you have a gauge, pack the flat and tools back in the trunk, and drive to a tire shop at moderate speed to have the spare inspected.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
    ],
  },
  {
    id: 'g2',
    title: 'Cook Perfect Spaghetti Aglio e Olio',
    description:
      'A classic 4-ingredient Italian pasta dish. Master salting the water, toasting garlic, and emulsifying the sauce.',
    category: 'Cooking',
    tags: ['italian', 'dinner', 'quick'],
    totalSteps: 5,
    completedSteps: 5,
    updatedAt: 'Yesterday',
    steps: [
      {
        id: 1,
        title: 'Salt the water generously',
        instruction:
          'Bring a large pot of water to a rolling boil and add a full tablespoon of coarse salt. It should taste noticeably like sea water — this is the only chance to season the pasta itself.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 2,
        title: 'Slice the garlic thin',
        instruction:
          'Peel 6 cloves of garlic and slice them paper-thin, or gently crush them with the flat of your knife. Thin slices turn golden evenly instead of burning fast.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 3,
        title: 'Toast the garlic in olive oil',
        instruction:
          'Warm half a cup of olive oil in a wide pan over medium-low heat. Add the garlic and chili flakes and let it turn pale gold, about 3 minutes. Pull it off the heat the moment it colors — burnt garlic is bitter.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 4,
        title: 'Cook the pasta just short of al dente',
        instruction:
          'Boil the spaghetti one minute less than the package says. Before draining, scoop out a mug of the starchy pasta water — it is the secret ingredient that turns oil and water into a sauce.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 5,
        title: 'Emulsify and serve',
        instruction:
          'Add the drained pasta to the garlic pan with a splash of pasta water. Toss vigorously over heat for a minute until the liquid looks creamy and clings to the noodles. Finish with parsley and grated parmesan.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
    ],
  },
  {
    id: 'g3',
    title: 'Repot a Root-Bound Houseplant',
    description:
      'Give an overgrown plant a new lease on life: when to repot, choosing the right soil mix, and settling it in without shock.',
    category: 'Plants',
    tags: ['monstera', 'care', 'spring'],
    totalSteps: 5,
    completedSteps: 1,
    updatedAt: '2 days ago',
    steps: [
      {
        id: 1,
        title: 'Confirm the plant is root-bound',
        instruction:
          'Slide the plant partway out of its pot and look: roots circling the bottom, growing out of drainage holes, or water rushing straight through all mean it is time. Water the day before so the root ball slides out easily.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 2,
        title: 'Choose a pot one size up',
        instruction:
          'Pick a pot 3-5 cm (1-2 in) wider than the current one. Too big a pot holds wet soil the roots cannot drink, which invites rot. Make sure it has drainage holes.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 3,
        title: 'Loosen and prune the root ball',
        instruction:
          'Gently tease apart the circling roots with your fingers. Snip off anything dead, mushy, or badly tangled with clean scissors. This tells the plant to grow outward into the new soil.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 4,
        title: 'Plant at the same depth',
        instruction:
          'Cover the drainage holes with a little fresh mix, then set the plant so its crown sits at exactly the same height it was before. Fill around the sides with soil, pressing lightly — do not compact it hard.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 5,
        title: 'Water thoroughly and let it recover',
        instruction:
          'Water until it drains freely from the bottom, then dump the saucer. Keep the plant out of direct sun for a week; some drooping is normal while the roots settle.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
    ],
  },
  {
    id: 'g4',
    title: 'Set Up a Level Bookshelf',
    description:
      'Assemble a wall-safe bookshelf that does not wobble: anchoring, leveling, and bracing it against tipping.',
    category: 'Home DIY',
    tags: ['furniture', 'tools', 'safety'],
    totalSteps: 4,
    completedSteps: 0,
    updatedAt: '1 week ago',
    steps: [
      {
        id: 1,
        title: 'Pick the wall and find the studs',
        instruction:
          'Choose a spot away from direct sunlight. Run a stud finder along the wall and mark stud centers with painter\'s tape — bookshelves full of books are heavy and must anchor into framing, not just drywall.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 2,
        title: 'Assemble the frame loosely',
        instruction:
          'Follow the manual to connect the sides, shelves, and back panel, but leave every screw a quarter turn loose. Checking alignment while everything is still flexible is far easier than after.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 3,
        title: 'Square it up and tighten',
        instruction:
          'Place a level on top of the unit; add shims under the low corner if needed. Measure both diagonals of the back — equal lengths mean the frame is square. Now tighten every screw.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
      {
        id: 4,
        title: 'Anchor it to the wall',
        instruction:
          'Drive the anti-tip strap or L-bracket into a stud at the top back of the shelf. Tug the top firmly to confirm it cannot tip forward. Load heavy books on the bottom shelves first.',
        hasReferenceImage: false,
        referenceImagePath: null,
      },
    ],
  },
];

export const completedGuides: CompletedGuide[] = [
  {
    id: 'g2',
    title: 'Cook Perfect Spaghetti Aglio e Olio',
    category: 'Cooking',
    completedAt: 'Yesterday',
    totalSteps: 5,
  },
  {
    id: 'g5',
    title: 'Fold a Fitted Sheet in Under a Minute',
    category: 'Home Skills',
    completedAt: 'Nov 16',
    totalSteps: 4,
  },
  {
    id: 'g6',
    title: 'Reset a Tripped Circuit Breaker',
    category: 'Home DIY',
    completedAt: 'Nov 9',
    totalSteps: 3,
  },
];
