import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'library' | 'player'
  const [currentView, setCurrentView] = useState('library');
  
  // Player state
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentMedia, setCurrentMedia] = useState(null);

  // 1. Request permission & load media on startup
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        loadMedia();
      } else {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Fetch all audio and video from device
  const loadMedia = async () => {
    setLoading(true);
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.audio, MediaLibrary.MediaType.video],
        first: 100, // Load the first 100 items
      });
      setMediaFiles(media.assets);
    } catch (error) {
      console.log("Error loading media:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Switch to Player View when a file is tapped
  const playMedia = (item) => {
    setCurrentMedia(item);
    setCurrentView('player');
  };

  // --- LIBRARY VIEW COMPONENT ---
  const renderLibrary = () => {
    if (hasPermission === false) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText} accessibilityRole="text">Permission to access media was denied. Please allow it in your phone settings.</Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0A84FF" accessibilityLabel="Scanning your phone for music and videos" />
          <Text style={styles.loadingText}>Scanning device...</Text>
        </View>
      );
    }

    return (
      <View style={styles.libraryContainer}>
        <Text style={styles.libraryTitle} accessibilityRole="header">Your Media Library</Text>
        <FlatList
          data={mediaFiles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.libraryItem} 
              onPress={() => playMedia(item)}
              accessibilityLabel={Play : }
              accessibilityRole="button"
            >
              <Text style={styles.itemTitle}>{item.filename}</Text>
              <Text style={styles.itemSubtitle}>{(item.duration / 60).toFixed(2)} mins | {item.mediaType.toUpperCase()}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.errorText} accessibilityRole="text">No music or videos found on your device.</Text>
          }
        />
      </View>
    );
  };

  // --- PLAYER VIEW COMPONENT ---
  const renderPlayer = () => {
    const handlePlayPause = () => { status.isPlaying ? videoRef.current.pauseAsync() : videoRef.current.playAsync(); };
    const handleSkipForward = async () => { if (status.positionMillis !== undefined) { await videoRef.current.setPositionAsync(status.positionMillis + 10000); } };
    const handleSkipBackward = async () => { if (status.positionMillis !== undefined) { await videoRef.current.setPositionAsync(Math.max(0, status.positionMillis - 10000)); } };
    const handleIncreaseSpeed = async () => { const newSpeed = playbackSpeed + 0.5; setPlaybackSpeed(newSpeed); await videoRef.current.setRateAsync(newSpeed, true); };
    const handleDecreaseSpeed = async () => { const newSpeed = Math.max(0.5, playbackSpeed - 0.5); setPlaybackSpeed(newSpeed); await videoRef.current.setRateAsync(newSpeed, true); };

    return (
      <View style={styles.container}>
        {/* Top Video Area */}
        <View style={styles.videoContainer}>
          <Video 
            ref={videoRef} 
            style={styles.video} 
            source={{ uri: currentMedia.uri }} 
            useNativeControls={false} 
            resizeMode={ResizeMode.CONTAIN} 
            shouldPlay={true}
            onPlaybackStatusUpdate={status => setStatus(() => status)} 
            accessibilityLabel={Media Player screen displaying } 
            accessibilityRole="image" 
          />
          <Text style={styles.mediaLabel} accessibilityRole="text">Now Playing: {currentMedia.filename}</Text>
        </View>

        {/* Bottom Controls Area */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setCurrentView('library')}
            accessibilityLabel="Back to media library"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Back to Library</Text>
          </TouchableOpacity>

          <Text style={styles.titleText}>Accessible Media Controls</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleDecreaseSpeed} accessibilityLabel="Reduce playback speed" accessibilityRole="button"><Text style={styles.buttonText}>0.5x Speed</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleSkipBackward} accessibilityLabel="Skip backward 10 seconds" accessibilityRole="button"><Text style={styles.buttonText}>-10s</Text></TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.playButton]} onPress={handlePlayPause} accessibilityLabel={status.isPlaying ? "Pause media" : "Play media"} accessibilityRole="button"><Text style={styles.buttonText}>{status.isPlaying ? "PAUSE" : "PLAY"}</Text></TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleSkipForward} accessibilityLabel="Skip forward 10 seconds" accessibilityRole="button"><Text style={styles.buttonText}>+10s</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleIncreaseSpeed} accessibilityLabel="Increase playback speed" accessibilityRole="button"><Text style={styles.buttonText}>1.5x Speed</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return currentView === 'library' ? renderLibrary() : renderPlayer();
}

// STANDARD DARK THEME STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'space-between' },
  centerContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: 20 },
  libraryContainer: { flex: 1, backgroundColor: '#000000', paddingTop: 50 },
  libraryTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, accessibilityRole: 'header' },
  libraryItem: { backgroundColor: '#1E1E1E', padding: 20, marginHorizontal: 16, marginBottom: 12, borderRadius: 10, borderLeftWidth: 5, borderLeftColor: '#0A84FF' },
  itemTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  itemSubtitle: { color: '#AAAAAA', fontSize: 14, marginTop: 4 },
  loadingText: { color: '#FFFFFF', marginTop: 16, fontSize: 16 },
  errorText: { color: '#FF453A', fontSize: 18, textAlign: 'center' },
  
  videoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', paddingBottom: 20, paddingTop: 40 },
  mediaLabel: { color: '#AAAAAA', fontSize: 14, marginTop: 10, textAlign: 'center', paddingHorizontal: 16 },
  video: { width: Dimensions.get('window').width, height: 250 },
  controlsContainer: { padding: 24, backgroundColor: '#1E1E1E', borderTopWidth: 2, borderTopColor: '#333333' },
  titleText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  backButton: { backgroundColor: '#FF9500', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  button: { flex: 1, backgroundColor: '#333333', padding: 16, marginHorizontal: 8, borderRadius: 8, alignItems: 'center' },
  playButton: { backgroundColor: '#0A84FF', paddingVertical: 24 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});
