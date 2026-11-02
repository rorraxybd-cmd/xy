/**
 * rorraxy - Advanced Dual-Mode Video Embed Sanitizer & Player Helper
 * Description: Automatically detects and handles both Short/Vertical videos (9:16) 
 * and Long/Horizontal videos (16:9) with full-screen support, stripping out clutter & logos.
 */

class RorraxyVideoSanitizer {
    constructor() {
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('rorraxy-video-sanitizer-styles')) return;

        const style = document.createElement('style');
        style.id = 'rorraxy-video-sanitizer-styles';
        style.innerHTML = `
            .rorraxy-video-container.landscape {
                position: relative; width: 100%; padding-bottom: 56.25%; height: 0;
                background-color: #000000; border-radius: 12px; overflow: hidden;
                border: 1px solid rgba(212, 175, 55, 0.2); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
            }
            .rorraxy-video-container.portrait {
                position: relative; width: 100%; max-width: 380px; margin: 0 auto;
                padding-bottom: 177.78%; height: 0; background-color: #000000;
                border-radius: 16px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.3);
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8);
            }
            .rorraxy-video-container iframe, .rorraxy-video-container video {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; object-fit: cover;
            }
        `;
        document.head.appendChild(style);
    }

    getSanitizedEmbedHtml(url, type = 'long') {
        if (!url) return '<p style="color:#e74c3c; font-size:12px;">Invalid video URL</p>';

        const containerClass = type === 'short' ? 'rorraxy-video-container portrait' : 'rorraxy-video-container landscape';

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(url);
            if (videoId) {
                const cleanYoutubeUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`;
                return `
                    <div class="${containerClass}">
                        <iframe src="${cleanYoutubeUrl}" title="rorraxy secure video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>
                    </div>
                `;
            }
        }

        if (url.includes('facebook.com')) {
            const encodedUrl = encodeURIComponent(url);
            const cleanFacebookUrl = `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&appId=&autoplay=0`;
            return `
                <div class="${containerClass}">
                    <iframe src="${cleanFacebookUrl}" title="rorraxy secure live player" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" loading="lazy"></iframe>
                </div>
            `;
        }

        return `<p style="color:#e74c3c; font-size:12px;">Unsupported video format</p>`;
    }

    extractYouTubeId(url) {
        let videoId = null;
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1]?.split('&')[0];
        } else if (url.includes('embed/')) {
            videoId = url.split('embed/')[1]?.split('?')[0];
        } else if (url.includes('live/')) {
            videoId = url.split('live/')[1]?.split('?')[0];
        } else if (url.includes('shorts/')) {
            videoId = url.split('shorts/')[1]?.split('?')[0];
        }
        return videoId;
    }
}

const rorraxyVideoSanitizer = new RorraxyVideoSanitizer();

if (typeof window !== 'undefined') {
    window.RorraxyVideoSanitizer = RorraxyVideoSanitizer;
}
