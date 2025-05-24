FROM ubuntu:22.04

# Set noninteractive frontend
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install dependencies
RUN apt-get update && apt-get install -y \
    software-properties-common \
    curl \
    wget \
    git \
    sudo \
    xorg \
    xvfb \
    x11vnc \
    openbox \
    python3-xdg \
    pulseaudio \
    mesa-utils \
    vulkan-tools \
    nvidia-driver-535 \
    nvidia-utils-535 \
    nvidia-cuda-toolkit \
    pkg-config \
    libboost-all-dev \
    xorg-dev \
    dbus \
    dbus-x11 \
    vainfo \
    va-driver-all \
    && rm -rf /var/lib/apt/lists/*

# Add Steam user to required groups and set up directories
RUN useradd -m steam && \
    usermod -aG sudo,input,video,render,audio steam && \
    echo "steam ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    # Create required directories with correct permissions
    mkdir -p /run/user/1000 && \
    chown -R steam:steam /run/user/1000 && \
    chmod 700 /run/user/1000 && \
    mkdir -p /home/steam/.config/pulse && \
    chown -R steam:steam /home/steam/.config

# Set up PulseAudio configuration
COPY --chown=steam:steam pulse-client.conf /home/steam/.config/pulse/client.conf

# Install Steam with correct path
RUN add-apt-repository multiverse && \
    dpkg --add-architecture i386 && \
    apt-get update && \
    echo steam steam/question select "I AGREE" | debconf-set-selections && \
    echo steam steam/license note '' | debconf-set-selections && \
    apt-get install -y \
    steam-installer \
    libgl1-mesa-dri:i386 \
    libgl1-mesa-glx:i386 \
    libc6:i386 \
    && rm -rf /var/lib/apt/lists/*

# Fix Steam path and permissions
RUN ln -s /usr/games/steam /usr/bin/steam && \
    mkdir -p /home/steam/.local/share/Steam && \
    chown -R steam:steam /home/steam/.local

# Install Sunshine
RUN wget https://github.com/LizardByte/Sunshine/releases/download/v0.20.0/sunshine-ubuntu-22.04-amd64.deb && \
    apt-get update && \
    dpkg -i sunshine-ubuntu-22.04-amd64.deb || true && \
    apt-get install -f -y && \
    rm sunshine-ubuntu-22.04-amd64.deb && \
    rm -rf /var/lib/apt/lists/*

# Fix permissions and create X11 config directory
RUN mkdir -p /etc/X11/xorg.conf.d && \
    mkdir -p /home/steam/.config/sunshine && \
    mkdir -p /home/steam/.config/openbox && \
    mkdir -p /home/steam/.local/share/Steam && \
    chown -R steam:steam /home/steam && \
    chmod 777 /etc/X11 && \
    chmod 777 /etc/X11/xorg.conf.d

# Copy configuration files
COPY xorg.conf /etc/X11/xorg.conf.d/10-virtual.conf
COPY sunshine.conf /home/steam/.config/sunshine/sunshine.conf

# Set working directory
WORKDIR /home/steam

# Switch to steam user
USER steam

# Start script
COPY start.sh /home/steam/start.sh
RUN sudo chmod +x /home/steam/start.sh

ENTRYPOINT ["/home/steam/start.sh"] 