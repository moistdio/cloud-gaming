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
    nvidia-driver-525 \
    nvidia-utils-525 \
    && rm -rf /var/lib/apt/lists/*

# Add Steam user
RUN useradd -m steam && \
    echo "steam ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install Steam
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

# Install Sunshine
RUN wget https://github.com/LizardByte/Sunshine/releases/download/v0.20.0/sunshine-ubuntu-22.04-amd64.deb && \
    dpkg -i sunshine-ubuntu-22.04-amd64.deb || true && \
    apt-get install -f -y && \
    rm sunshine-ubuntu-22.04-amd64.deb

# Create virtual display configuration
RUN mkdir -p /etc/X11/xorg.conf.d
COPY xorg.conf /etc/X11/xorg.conf.d/10-virtual.conf

# Set up Sunshine configuration
COPY sunshine.conf /home/steam/.config/sunshine/sunshine.conf
RUN mkdir -p /home/steam/.config && \
    chown -R steam:steam /home/steam/.config

# Create Openbox configuration directory
RUN mkdir -p /home/steam/.config/openbox && \
    chown -R steam:steam /home/steam/.config/openbox

# Set working directory
WORKDIR /home/steam

# Switch to steam user
USER steam

# Start script
COPY start.sh /home/steam/start.sh
RUN sudo chmod +x /home/steam/start.sh

ENTRYPOINT ["/home/steam/start.sh"] 