FROM ubuntu:22.04

# Build-Argumente für Konfiguration
ARG VNC_PASSWORD=cloudgaming

# Umgebungsvariablen setzen
ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1
ENV VNC_PORT=11000
ENV WEB_VNC_PORT=12000

# GPU-spezifische Umgebungsvariablen
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=all
ENV NVIDIA_REQUIRE_CUDA="cuda>=11.0"
ENV LIBGL_ALWAYS_INDIRECT=0
ENV LIBGL_ALWAYS_SOFTWARE=0

# System aktualisieren und grundlegende Pakete installieren
RUN apt-get update && apt-get install -y \
    # Desktop-Umgebung
    xfce4 \
    xfce4-goodies \
    xfce4-terminal \
    # VNC-Server
    tightvncserver \
    x11vnc \
    # X11 und Fonts
    xfonts-base \
    xfonts-75dpi \
    xfonts-100dpi \
    xfonts-scalable \
    xserver-xorg-core \
    xvfb \
    # GPU und Graphics Support
    xserver-xorg-video-all \
    mesa-utils \
    mesa-utils-extra \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglu1-mesa \
    libglew-dev \
    freeglut3-dev \
    # System-Tools
    sudo \
    pciutils \
    lshw \
    # Netzwerk-Tools
    net-tools \
    curl \
    wget \
    # Entwicklungstools
    git \
    nano \
    vim \
    htop \
    unzip \
    # Anwendungen
    firefox \
    libreoffice \
    gedit \
    thunar \
    # System-Tools
    software-properties-common \
    dbus-x11 \
    # Python für noVNC
    python3 \
    python3-pip \
    python3-numpy \
    # Zusätzliche Pakete
    fonts-liberation \
    fonts-dejavu \
    # Hardware-beschleunigte Video-Codecs
    vainfo \
    vdpauinfo \
    # Audio-Support für Steam
    pulseaudio \
    pulseaudio-utils \
    alsa-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


# NVIDIA Container Toolkit Repository hinzufügen
RUN curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
    && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# CUDA Repository hinzufügen
RUN wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb \
    && dpkg -i cuda-keyring_1.0-1_all.deb \
    && rm cuda-keyring_1.0-1_all.deb

# NVIDIA Treiber und CUDA installieren (Latest available with fallback)
# Note: NVIDIA Vulkan support is included in the main driver packages
RUN apt-get update && \
    # Try to install latest driver (550), fallback to 545, then 535
    (apt-get install -y \
        nvidia-driver-550 \
        nvidia-utils-550 \
        libnvidia-gl-550 \
        libnvidia-encode-550 \
        libnvidia-decode-550 \
    ) || \
    (echo "Driver 550 not available, trying 545..." && apt-get install -y \
        nvidia-driver-545 \
        nvidia-utils-545 \
        libnvidia-gl-545 \
        libnvidia-encode-545 \
        libnvidia-decode-545 \
    ) || \
    (echo "Driver 545 not available, using 535..." && apt-get install -y \
        nvidia-driver-535 \
        nvidia-utils-535 \
        libnvidia-gl-535 \
        libnvidia-encode-535 \
        libnvidia-decode-535 \
    ) && \
    # Install CUDA and container toolkit
    apt-get install -y \
        cuda-toolkit \
        nvidia-container-toolkit \
    # GLVND (GL Vendor Neutral Dispatch) Libraries
    libglvnd0 \
    libglvnd-dev \
    libgl1 \
    libglx0 \
    libegl1 \
    # Mesa GLX Libraries (für Fallback)
    libgl1-mesa-dri \
    libglx-mesa0 \
    libgl1-mesa-glx \
    # GPU Monitoring Tools (jetzt verfügbar)
    nvtop \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# NVIDIA GLX-Konfiguration für Container (nur 64-bit)
RUN echo "/usr/lib/x86_64-linux-gnu/nvidia" > /etc/ld.so.conf.d/nvidia.conf && \
    ldconfig

# Gaming und Multimedia Software installieren
# Steam Repository hinzufügen für bessere Kompatibilität
RUN dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -y software-properties-common && \
    # Multiverse Repository für Steam aktivieren
    add-apt-repository multiverse && \
    apt-get update

# Gaming Software installieren (mit Fehlerbehandlung)
RUN apt-get update && apt-get install -y \
    # Wine und Windows-Kompatibilität
    wine \
    winetricks \
    wine32 \
    wine64 \
    # Gaming-Tools (verfügbare Pakete)
    gamemode \
    # Zusätzliche Gaming-Abhängigkeiten (korrigierte Paketnamen)
    libc6:i386 \
    libncurses5:i386 \
    libstdc++6:i386 \
    lib32z1 \
    libbz2-1.0:i386 \
    libasound2:i386 \
    lib32stdc++6 \
    # Zusätzliche Wine-Abhängigkeiten
    libfreetype6:i386 \
    libfontconfig1:i386 \
    libxrender1:i386 \
    libxrandr2:i386 \
    libxfixes3:i386 \
    libxcomposite1:i386 \
    libxdamage1:i386 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Multimedia-Codecs separat installieren (non-interactive)
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections && \
    apt-get update && \
    (apt-get install -y ubuntu-restricted-extras || echo "Restricted extras not available, skipping...") && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Steam direkt installieren (einfacher Ansatz) - moved after user creation
RUN echo "Installing Steam directly..." && \
    # Steam über multiverse Repository installieren
    apt-get update && \
    apt-get install -y steam-installer && \
    # Steam-Installer akzeptiert automatisch die Lizenz
    echo steam steam/question select "I AGREE" | debconf-set-selections && \
    echo steam steam/license note '' | debconf-set-selections && \
    # Cleanup
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    echo "Steam installation completed successfully"

# Zusätzliche Steam-Abhängigkeiten für Container-Kompatibilität
RUN apt-get update && apt-get install -y \
    # CEF/Chromium-Abhängigkeiten für steamwebhelper
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    # Zusätzliche Steam-Runtime-Abhängigkeiten
    libgpg-error0 \
    libxml2 \
    libxslt1.1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# MangoHud separat installieren (falls verfügbar)
RUN apt-get update && \
    (apt-get install -y mangohud || echo "MangoHud not available, skipping...") && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Vulkan Support installieren (enhanced based on GitHub issue #393003)
# Note: NVIDIA Vulkan driver is included in nvidia-driver packages above
# This installs the Vulkan loader and tools for all GPU types
RUN apt-get update && apt-get install -y \
    vulkan-tools \
    vulkan-validationlayers \
    libvulkan1 \
    mesa-vulkan-drivers \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# NVIDIA Vulkan ICD Verzeichnis erstellen (wird von gpu-init.sh konfiguriert)
RUN mkdir -p /usr/share/vulkan/icd.d

# Set system-wide Vulkan environment variables (GitHub issue #393003 fix)
RUN echo '# Vulkan Environment Variables for Steam and Games (GitHub issue #393003 fix)' >> /etc/environment && \
    echo 'VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /etc/environment && \
    echo 'VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d' >> /etc/environment && \
    echo 'VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /etc/environment && \
    echo 'VK_INSTANCE_LAYERS=' >> /etc/environment && \
    echo 'VK_DEVICE_LAYERS=' >> /etc/environment && \
    echo 'VK_LOADER_DEBUG=error' >> /etc/environment && \
    echo 'VK_LOADER_LAYERS_ENABLE=' >> /etc/environment

# Additional Vulkan development packages (GitHub issue #393003 solution)
RUN apt-get update && apt-get install -y \
    # Additional packages for Steam Vulkan compatibility
    libvulkan-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# noVNC von GitHub installieren (neueste Version)
RUN cd /opt && \
    git clone https://github.com/novnc/noVNC.git && \
    git clone https://github.com/novnc/websockify.git && \
    cd /opt/noVNC && \
    ln -s vnc.html index.html && \
    cd /opt/websockify && \
    python3 setup.py install

# Benutzer erstellen (wird zur Laufzeit überschrieben)
RUN useradd -m -s /bin/bash -u 1000 user && \
    echo "user:cloudgaming" | chpasswd && \
    usermod -aG sudo user && \
    # Benutzer zu GPU-Gruppen hinzufügen
    usermod -aG video user && \
    usermod -aG render user

# VNC-Verzeichnis vorbereiten
RUN mkdir -p /home/user/.vnc && \
    chown -R user:user /home/user

# Steam-Verzeichnisse vorbereiten (nach Benutzer-Erstellung)
RUN mkdir -p /home/user/.steam && \
    mkdir -p /home/user/.local/share/Steam && \
    mkdir -p /home/user/.config/steam && \
    # Steam-Berechtigungen setzen
    chown -R user:user /home/user/.steam /home/user/.local/share/Steam /home/user/.config/steam && \
    # Steam-Konfiguration für Container-Optimierung
    echo 'export STEAM_COMPAT_CLIENT_INSTALL_PATH=/home/user/.steam' >> /home/user/.bashrc && \
    echo 'export STEAM_RUNTIME=1' >> /home/user/.bashrc && \
    echo 'export __GLX_VENDOR_LIBRARY_NAME=nvidia' >> /home/user/.bashrc && \
    # Vulkan environment variables for Steam (GitHub issue #393003 fix)
    echo 'export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /home/user/.bashrc && \
    echo 'export VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d' >> /home/user/.bashrc && \
    echo 'export VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /home/user/.bashrc && \
    echo 'export VK_INSTANCE_LAYERS=""' >> /home/user/.bashrc && \
    echo 'export VK_DEVICE_LAYERS=""' >> /home/user/.bashrc && \
    echo 'export VK_LOADER_DEBUG=error' >> /home/user/.bashrc && \
    echo 'export VK_LOADER_LAYERS_ENABLE=""' >> /home/user/.bashrc

# Desktop-Konfiguration für XFCE4
RUN mkdir -p /home/user/.config/xfce4/xfconf/xfce-perchannel-xml && \
    chown -R user:user /home/user/.config

# Standard XFCE4 Konfiguration erstellen
RUN echo '<?xml version="1.0" encoding="UTF-8"?>\n\
<channel name="xfce4-desktop" version="1.0">\n\
  <property name="backdrop" type="empty">\n\
    <property name="screen0" type="empty">\n\
      <property name="monitor0" type="empty">\n\
        <property name="workspace0" type="empty">\n\
          <property name="color-style" type="int" value="0"/>\n\
          <property name="image-style" type="int" value="5"/>\n\
          <property name="last-image" type="string" value=""/>\n\
        </property>\n\
      </property>\n\
    </property>\n\
  </property>\n\
</channel>' > /home/user/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml

# Panel-Konfiguration
RUN echo '<?xml version="1.0" encoding="UTF-8"?>\n\
<channel name="xfce4-panel" version="1.0">\n\
  <property name="configver" type="int" value="2"/>\n\
  <property name="panels" type="array">\n\
    <value type="int" value="1"/>\n\
    <property name="panel-1" type="empty">\n\
      <property name="position" type="string" value="p=6;x=0;y=0"/>\n\
      <property name="length" type="uint" value="100"/>\n\
      <property name="position-locked" type="bool" value="true"/>\n\
      <property name="size" type="uint" value="30"/>\n\
      <property name="plugin-ids" type="array">\n\
        <value type="int" value="1"/>\n\
        <value type="int" value="2"/>\n\
        <value type="int" value="3"/>\n\
        <value type="int" value="4"/>\n\
      </property>\n\
    </property>\n\
  </property>\n\
  <property name="plugins" type="empty">\n\
    <property name="plugin-1" type="string" value="applicationsmenu"/>\n\
    <property name="plugin-2" type="string" value="tasklist"/>\n\
    <property name="plugin-3" type="string" value="systray"/>\n\
    <property name="plugin-4" type="string" value="clock"/>\n\
  </property>\n\
</channel>' > /home/user/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml

# GPU-Test-Anwendungen installieren
RUN apt-get update && apt-get install -y \
    # 3D-Test-Anwendungen
    glmark2 \
    mesa-utils \
    mesa-utils-extra \
    # Zusätzliche GPU-Test-Tools
    x11-apps \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# VirtualGL separat von offizieller Quelle installieren
RUN cd /tmp && \
    wget -q https://sourceforge.net/projects/virtualgl/files/3.1/virtualgl_3.1_amd64.deb/download -O virtualgl_3.1_amd64.deb && \
    dpkg -i virtualgl_3.1_amd64.deb || apt-get install -f -y && \
    rm virtualgl_3.1_amd64.deb

# Lutris separat installieren (mit PPA für neueste Version)
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    (add-apt-repository ppa:lutris-team/lutris -y || echo "Lutris PPA not available") && \
    apt-get update && \
    (apt-get install -y lutris || echo "Lutris not available, skipping...") && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# X11-Konfiguration für GPU-Beschleunigung
RUN mkdir -p /etc/X11/xorg.conf.d && \
    echo 'Section "Device"\n\
    Identifier "nvidia"\n\
    Driver "nvidia"\n\
    VendorName "NVIDIA Corporation"\n\
    Option "AllowEmptyInitialConfiguration"\n\
    Option "UseDisplayDevice" "None"\n\
EndSection' > /etc/X11/xorg.conf.d/10-nvidia.conf

# Desktop-Shortcuts erstellen
RUN mkdir -p /home/user/Desktop && \
    # Steam Desktop-Shortcut with enhanced Vulkan support (GitHub issue #393003 fix)
    echo '[Desktop Entry]' > /home/user/Desktop/Steam.desktop && \
    echo 'Version=1.0' >> /home/user/Desktop/Steam.desktop && \
    echo 'Type=Application' >> /home/user/Desktop/Steam.desktop && \
    echo 'Name=Steam (Enhanced Vulkan)' >> /home/user/Desktop/Steam.desktop && \
    echo 'Comment=Steam with enhanced Vulkan environment for gaming' >> /home/user/Desktop/Steam.desktop && \
    echo 'Exec=/usr/local/bin/steam-vulkan' >> /home/user/Desktop/Steam.desktop && \
    echo 'Icon=steam' >> /home/user/Desktop/Steam.desktop && \
    echo 'Terminal=false' >> /home/user/Desktop/Steam.desktop && \
    echo 'Categories=Game;' >> /home/user/Desktop/Steam.desktop && \
    echo 'StartupNotify=true' >> /home/user/Desktop/Steam.desktop && \
    echo 'MimeType=x-scheme-handler/steam;' >> /home/user/Desktop/Steam.desktop && \
    # Vulkan Test Desktop-Shortcut
    echo '[Desktop Entry]' > /home/user/Desktop/Vulkan-Test.desktop && \
    echo 'Version=1.0' >> /home/user/Desktop/Vulkan-Test.desktop && \
    echo 'Type=Application' >> /home/user/Desktop/Vulkan-Test.desktop && \
    echo 'Name=Vulkan Test' >> /home/user/Desktop/Vulkan-Test.desktop && \
    echo 'Comment=Test Vulkan configuration and drivers' >> /home/user/Desktop/Vulkan-Test.desktop && \
    echo 'Exec=xfce4-terminal --hold -e test-vulkan.sh' >> /home/user/Desktop/Vulkan-Test.desktop && \
    echo 'Icon=applications-system' >> /home/user/Desktop/Vulkan-Test.desktop && \
    echo 'Terminal=false' >> /home/user/Desktop/Vulkan-Test.desktop && \
    echo 'Categories=System;HardwareSettings;' >> /home/user/Desktop/Vulkan-Test.desktop

# Berechtigungen setzen
RUN chown -R user:user /home/user/.config && \
    chown -R user:user /home/user/Desktop && \
    chmod +x /home/user/Desktop/Steam.desktop

# GPU-Initialisierungs-Script erstellen
COPY gpu-init.sh /usr/local/bin/gpu-init.sh
RUN chmod +x /usr/local/bin/gpu-init.sh

# Vulkan-Test-Script kopieren
COPY test-vulkan.sh /usr/local/bin/test-vulkan.sh
RUN chmod +x /usr/local/bin/test-vulkan.sh

# Steam-Wrapper-Script kopieren
COPY steam-wrapper.sh /usr/local/bin/steam-wrapper.sh
RUN chmod +x /usr/local/bin/steam-wrapper.sh

# Steam-Initialisierungs-Script kopieren
COPY steam-init.sh /usr/local/bin/steam-init.sh
RUN chmod +x /usr/local/bin/steam-init.sh

# Create enhanced Steam launcher with Vulkan support (GitHub issue #393003 fix)
RUN echo '#!/bin/bash' > /usr/local/bin/steam-vulkan && \
    echo '# Enhanced Steam launcher with Vulkan support (GitHub issue #393003 comprehensive fix)' >> /usr/local/bin/steam-vulkan && \
    echo '' >> /usr/local/bin/steam-vulkan && \
    echo '# CRITICAL: Always set correct Vulkan environment variables' >> /usr/local/bin/steam-vulkan && \
    echo 'export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /usr/local/bin/steam-vulkan && \
    echo 'export VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d:/usr/share/vulkan/implicit_layer.d' >> /usr/local/bin/steam-vulkan && \
    echo 'export VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /usr/local/bin/steam-vulkan && \
    echo 'export VK_INSTANCE_LAYERS=""' >> /usr/local/bin/steam-vulkan && \
    echo 'export VK_DEVICE_LAYERS=""' >> /usr/local/bin/steam-vulkan && \
    echo 'export VK_LOADER_DEBUG=error' >> /usr/local/bin/steam-vulkan && \
    echo 'export VK_LOADER_LAYERS_ENABLE=""' >> /usr/local/bin/steam-vulkan && \
    echo 'export __GLX_VENDOR_LIBRARY_NAME=nvidia' >> /usr/local/bin/steam-vulkan && \
    echo 'export LIBGL_ALWAYS_INDIRECT=0' >> /usr/local/bin/steam-vulkan && \
    echo 'export LIBGL_ALWAYS_SOFTWARE=0' >> /usr/local/bin/steam-vulkan && \
    echo 'export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu/nvidia:/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"' >> /usr/local/bin/steam-vulkan && \
    echo 'export DISPLAY=:1' >> /usr/local/bin/steam-vulkan && \
    echo 'export XDG_RUNTIME_DIR=/tmp/runtime-user' >> /usr/local/bin/steam-vulkan && \
    echo 'mkdir -p $XDG_RUNTIME_DIR 2>/dev/null || true' >> /usr/local/bin/steam-vulkan && \
    echo 'chmod 700 $XDG_RUNTIME_DIR 2>/dev/null || true' >> /usr/local/bin/steam-vulkan && \
    echo '' >> /usr/local/bin/steam-vulkan && \
    echo '# Additional Steam flags for container compatibility' >> /usr/local/bin/steam-vulkan && \
    echo 'STEAM_FLAGS="--no-cef-sandbox --disable-gpu-sandbox --in-process-gpu --disable-dev-shm-usage --disable-software-rasterizer --enable-features=VaapiVideoDecoder --use-gl=desktop"' >> /usr/local/bin/steam-vulkan && \
    echo '' >> /usr/local/bin/steam-vulkan && \
    echo 'echo "🚀 Starting Steam with enhanced Vulkan support..."' >> /usr/local/bin/steam-vulkan && \
    echo 'echo "Environment: VK_ICD_FILENAMES=$VK_ICD_FILENAMES"' >> /usr/local/bin/steam-vulkan && \
    echo '' >> /usr/local/bin/steam-vulkan && \
    echo '# Start Steam with all optimizations' >> /usr/local/bin/steam-vulkan && \
    echo 'exec steam $STEAM_FLAGS "$@"' >> /usr/local/bin/steam-vulkan && \
    chmod +x /usr/local/bin/steam-vulkan

# Startup-Script kopieren
COPY start-desktop.sh /usr/local/bin/start-desktop.sh
RUN chmod +x /usr/local/bin/start-desktop.sh

# Steam-Wrapper als Standard-Steam-Befehl einrichten
RUN ln -sf /usr/local/bin/steam-wrapper.sh /usr/local/bin/steam

# VNC-Passwort als Umgebungsvariable setzen (zur Laufzeit)
ENV VNC_PASSWORD=${VNC_PASSWORD}

# Port-Bereiche freigeben (VNC: 11000-11430, Web: 12000-12430)
EXPOSE 11000-11430 12000-12430

# Arbeitsverzeichnis setzen
WORKDIR /home/user

# Als root starten (für Benutzer-Setup), dann zu user wechseln
USER root

# Health-Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD netstat -ln | grep -q ":${VNC_PORT:-11000} " || exit 1

# Desktop starten
CMD ["/usr/local/bin/start-desktop.sh"] 