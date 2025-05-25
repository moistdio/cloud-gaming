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
    # X11 und Fonts
    xfonts-base \
    xfonts-75dpi \
    xfonts-100dpi \
    xfonts-scalable \
    xserver-xorg-core \
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

# NVIDIA Treiber und CUDA installieren
RUN apt-get update && apt-get install -y \
    # NVIDIA Treiber
    nvidia-driver-535 \
    nvidia-utils-535 \
    # CUDA Toolkit
    cuda-toolkit-12-2 \
    # NVIDIA Container Toolkit
    nvidia-container-toolkit \
    # Zusätzliche GPU Libraries
    libnvidia-gl-535 \
    libnvidia-encode-535 \
    libnvidia-decode-535 \
    # GPU Monitoring Tools (jetzt verfügbar)
    nvtop \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Gaming und Multimedia Software installieren
# Steam Repository hinzufügen für bessere Kompatibilität
RUN dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -y software-properties-common && \
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

# Steam manuell installieren (robuster Ansatz)
RUN cd /tmp && \
    wget -q https://steamcdn-a.akamaihd.net/client/installer/steam.deb && \
    dpkg -i steam.deb || apt-get install -f -y && \
    rm steam.deb || true

# MangoHud separat installieren (falls verfügbar)
RUN apt-get update && \
    (apt-get install -y mangohud || echo "MangoHud not available, skipping...") && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Vulkan Support installieren
RUN apt-get update && apt-get install -y \
    vulkan-tools \
    vulkan-validationlayers \
    libvulkan1 \
    mesa-vulkan-drivers \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# NVIDIA Vulkan ICD separat konfigurieren (falls NVIDIA Treiber installiert)
RUN mkdir -p /usr/share/vulkan/icd.d && \
    if [ -f /usr/lib/x86_64-linux-gnu/libGL.so.1 ]; then \
        echo '{"file_format_version": "1.0.0", "ICD": {"library_path": "libGLX_nvidia.so.0", "api_version": "1.3.0"}}' > /usr/share/vulkan/icd.d/nvidia_icd.json || true; \
    fi

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
    # VirtualGL für OpenGL über VNC
    virtualgl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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

# Berechtigungen setzen
RUN chown -R user:user /home/user/.config

# GPU-Initialisierungs-Script erstellen
COPY gpu-init.sh /usr/local/bin/gpu-init.sh
RUN chmod +x /usr/local/bin/gpu-init.sh

# Startup-Script kopieren
COPY start-desktop.sh /usr/local/bin/start-desktop.sh
RUN chmod +x /usr/local/bin/start-desktop.sh

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