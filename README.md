# Dual Spectrum

**An Interactive Expression of Bipolar I Disorder**

A digital artwork by Destiny A., Christian H., Thomas M., Aran S. (2025)
Northwest Vista

## Description

This website visually represents the contrasting emotional states of mania and depression experienced in Bipolar I Disorder. The color transitions, animations, and audio elements reflect the alternating energy levels and emotional intensity. It allows users to click between two states — "Manic" and "Depressive" — to experience the shift in perception, tone, and speed.

## Features

### Core Features
- **Three State System**: Toggle between Manic, Mixed, and Depressive states
- **Dynamic Visuals**: Color transitions, particle effects, and animations that change based on state
- **Dynamic Thoughts/Feelings**: Rotating text that reflects the internal experience of each state (7 thoughts per state)
- **Breathing Visualization**: Animated breathing pattern that changes speed and intensity with each state
- **Mouse Trail Effects**: Visual feedback that changes color and intensity with each state

### Interactive Controls
- **Statistics Tracking**: Real-time display of time spent in each state with percentages
- **Mood Timeline**: Visual graph showing state transitions over time (up to 100 data points)
- **Intensity Slider**: Adjust the visual intensity and animation speed (50% - 200%)
- **Auto-Transition Mode**: Optional automatic cycling through all three states every 8 seconds
- **Fullscreen Mode**: Immersive viewing experience
- **Share Functionality**: Copy link, download image, or copy statistics text

### Educational & Accessibility
- **Educational Info Panel**: Toggleable information about Bipolar I Disorder and all three episode types
- **Sound Effects**: Web Audio API-generated click and transition sounds
- **Keyboard Shortcuts**: 
  - Press 'M' for Manic
  - Press 'X' for Mixed
  - Press 'D' for Depressive
- **Mobile Swipe Gestures**: Swipe left/right to switch between states on touch devices
- **Audio Integration**: Optional ambient audio for each state (add your own audio files)
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **PWA Ready**: Can be installed as a web app on mobile devices

## Deployment to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to link your project and deploy.

### Option 2: Using GitHub

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will automatically detect the configuration and deploy

### Option 3: Drag and Drop

1. Go to [vercel.com](https://vercel.com)
2. Sign in or create an account
3. Drag and drop the project folder onto the Vercel dashboard
4. Vercel will deploy it automatically

## Adding Audio Files (Optional)

To enhance the experience, add audio files to the `audio/` directory:

- `audio/manic-ambient.mp3` - Energetic, fast-paced audio for manic state
- `audio/mixed-ambient.mp3` - Chaotic, conflicting audio for mixed state
- `audio/depressive-ambient.mp3` - Slow, somber audio for depressive state

The website will work without these files, but they add to the immersive experience.

## Adding State Images

Place your emotional state images in the `images/` directory:

- `images/neutral.png` (or `.jpg`) - Neutral state (0) - shown in Mixed state
- `images/positive.png` (or `.jpg`) - Positive/Manic state (3) - shown in Manic state
- `images/depressive.png` (or `.jpg`) - Very Depressive state (-3) - shown in Depressive state

**Image Mapping:**
- **Manic State** → Shows `positive.png` (positive/energetic expression)
- **Mixed State** → Shows `neutral.png` (neutral/balanced expression)
- **Depressive State** → Shows `depressive.png` (very depressive expression)

The images will automatically display based on the current state with smooth transitions and state-appropriate animations. Supported formats: PNG, JPG, JPEG, WebP.

## Features Overview

### Statistics Panel
Tracks and displays the total time spent in each state, updating in real-time. Shows formatted time (M:SS) for each state.

### Mood Timeline
Click the 📊 button to view a visual timeline graph showing your state transitions. The graph displays:
- State changes over time
- Color-coded lines (Yellow = Manic, Purple = Mixed, White = Depressive)
- Up to 100 data points
- Clear button to reset the timeline

### Intensity Control
Adjust the visual intensity slider to:
- Increase/decrease animation speeds
- Make visuals more or less intense
- Range from 50% (slower, subtler) to 200% (faster, more intense)

### Share Options
- **Copy Link**: Copy the current page URL to clipboard
- **Download Image**: Export the artwork as an image (requires html2canvas library for full functionality)
- **Copy Text**: Copy formatted statistics and artwork information

### Sound Effects
The website includes procedurally generated sound effects:
- Click sounds when switching states (different frequencies per state)
- Transition sounds when states change
- All sounds use Web Audio API (no external files needed)

### Mobile Features
- **Swipe Gestures**: Swipe left or right anywhere on the screen to cycle through states
- **Touch-Optimized**: All buttons have minimum 44px touch targets for easy interaction
- **Responsive Layout**: Automatically adapts to different screen sizes and orientations
- **Safe Area Support**: Handles device notches and safe areas properly
- **No Zoom on Double Tap**: Prevents accidental zooming during interactions
- **Pull-to-Refresh Prevention**: Prevents accidental page refresh during swipes
- **Mobile Hint**: Shows a helpful hint on first load (auto-hides after interaction)

## Local Development

To run locally:

```bash
npm install
npm run dev
```

Or simply open `index.html` in a web browser.

## APA Citation

Destiny A., Christian H., Thomas M., & Aran S. (2025). *Dual Spectrum* [Digital artwork]. Northwest Vista.

## License

MIT

