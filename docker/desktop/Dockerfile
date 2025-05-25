FROM ubuntu:22.04

# Umgebungsvariablen setzen
ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1
ENV VNC_PORT=11000
ENV WEB_VNC_PORT=12000
ENV VNC_PASSWORD=cloudgaming

# System aktualisieren und grundlegende Pakete installieren
RUN apt-get update && apt-get install -y \
    # Desktop-Umgebung
    xfce4 \
    xfce4-goodies \
    xfce4-terminal \
    # VNC-Server
    tightvncserver \
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
    usermod -aG sudo user

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

# Berechtigungen setzen
RUN chown -R user:user /home/user/.config

# Startup-Script kopieren
COPY start-desktop.sh /usr/local/bin/start-desktop.sh
RUN chmod +x /usr/local/bin/start-desktop.sh

# Dynamische Ports freigeben (werden zur Laufzeit gesetzt)
EXPOSE 11000-12999

# Arbeitsverzeichnis setzen
WORKDIR /home/user

# Als root starten (für Benutzer-Setup), dann zu user wechseln
USER root

# Health-Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD netstat -ln | grep -q ":${VNC_PORT:-11000} " || exit 1

# Desktop starten
CMD ["/usr/local/bin/start-desktop.sh"] 