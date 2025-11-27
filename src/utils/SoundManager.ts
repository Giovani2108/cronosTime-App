import Sound from 'react-native-sound';

Sound.setCategory('Playback');

export const sounds: { [key: string]: Sound } = {};

export const loadSounds = () => {
    // In a real app, you would have sound files in android/app/src/main/res/raw
    // For this demo, we'll try to load a dummy file or just log
    // sounds['coin'] = new Sound('coin_sound.mp3', Sound.MAIN_BUNDLE, (error) => {
    //   if (error) {
    //     console.log('failed to load the sound', error);
    //     return;
    //   }
    // });
};

export const playSound = (soundName: string) => {
    console.log(`Playing sound: ${soundName}`);
    // if (sounds[soundName]) {
    //   sounds[soundName].play((success) => {
    //     if (!success) {
    //       console.log('playback failed due to audio decoding errors');
    //     }
    //   });
    // }
};
