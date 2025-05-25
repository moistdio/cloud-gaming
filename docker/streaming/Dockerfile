FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg2 \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    sudo \
    xvfb \
    x11vnc \
    x11-utils \
    fluxbox \
    pulseaudio \
    alsa-utils \
    mesa-utils \
    vainfo \
    vdpauinfo \
    xterm \
    firefox \
    pcmanfm \
    gedit \
    htop \
    vim \
    git \
    && rm -rf /var/lib/apt/lists/*

# Add multiverse repository for steam
RUN add-apt-repository multiverse && \
    apt-get update && \
    apt-get install -y steam-installer && \
    rm -rf /var/lib/apt/lists/*

# Install Sunshine
RUN wget -O sunshine.deb https://github.com/LizardByte/Sunshine/releases/latest/download/sunshine-ubuntu-22.04-amd64.deb \
    && dpkg -i sunshine.deb || apt-get install -f -y \
    && rm sunshine.deb

# Create steam user
RUN useradd -m -s /bin/bash steam \
    && usermod -aG audio,video,input steam \
    && echo "steam ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set up X11 and audio
RUN mkdir -p /tmp/.X11-unix \
    && chmod 1777 /tmp/.X11-unix

# Copy configuration files
COPY docker/streaming/config/ /config/
COPY docker/streaming/scripts/ /scripts/
RUN chmod +x /scripts/*.sh

# Set up Sunshine configuration
RUN mkdir -p /home/steam/.config/sunshine \
    && chown -R steam:steam /home/steam/.config

# Expose ports
EXPOSE 47989/tcp 47989/udp 5900

# Set environment variables
ENV DISPLAY=:0
ENV PULSE_RUNTIME_PATH=/var/run/pulse
ENV XDG_RUNTIME_DIR=/tmp/runtime-steam

# Switch to steam user
USER steam
WORKDIR /home/steam

# Start script
CMD ["/scripts/start.sh"] 