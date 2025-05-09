import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MethodologyModalProps {
  open: boolean;
  onClose: () => void;
}

const MethodologyModal: React.FC<MethodologyModalProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm"
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.98, y: 24 }}
          transition={{ duration: 0.18 }}
          className="relative z-[101] bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-200 ring-1 ring-slate-100 p-8 max-w-2xl w-full mx-4 overflow-hidden"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 rounded-full p-1"
            onClick={onClose}
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">☀️</span>
              <h2 className="text-2xl font-bold text-slate-900">
                La science derrière ton apéro au soleil
              </h2>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Sources de données principales
              </h3>
              <ul className="list-disc pl-6 text-slate-700 text-base space-y-2">
                <li>
                  <span className="font-medium">
                    Terrasses autorisées à Paris
                  </span>
                  <br />
                  <span className="text-slate-600">
                    Fichier GeoJSON listant les emplacements des terrasses
                    disposant d&apos;une autorisation officielle.
                    <br />
                    <a
                      href="https://opendata.paris.fr/explore/dataset/terrasses-autorisations/information/?disjunctive.arrondissement&disjunctive.typologie"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary hover:text-primary-dark"
                    >
                      Lien vers le jeu de données
                    </a>
                  </span>
                </li>
                <li>
                  <span className="font-medium">
                    Modèle Numérique de Surface (MNS) – IGN
                  </span>
                  <br />
                  <span className="text-slate-600">
                    Raster haute résolution (50 cm) représentant la hauteur du
                    sol, des bâtiments et de la végétation, utilisé pour la
                    détection des ombres.
                    <br />
                    <a
                      href="https://geoservices.ign.fr/modeles-numeriques-de-surfaces-correles"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary hover:text-primary-dark"
                    >
                      Lien vers le MNS – IGN
                    </a>
                  </span>
                </li>
                <li>
                  <span className="font-medium">
                    Position du soleil – bibliothèque pvlib
                  </span>
                  <br />
                  <span className="text-slate-600">
                    Permet de calculer, pour chaque créneau horaire simulé,
                    l&apos;azimut et la hauteur du soleil.
                  </span>
                </li>
                <li>
                  <span className="font-medium">
                    Cloud cover rate – Open-Meteo
                  </span>
                  <br />
                  <span className="text-slate-600">
                    Données horaires sur la couverture nuageuse. Si le ciel est
                    trop couvert, la terrasse est considérée comme à
                    l&apos;ombre, même sans obstacle.
                  </span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">Approche</h3>
              <ol className="list-decimal pl-6 text-slate-700 text-base space-y-2">
                <li>
                  <span className="font-medium">Position du soleil</span>
                  <br />
                  <span className="text-slate-600">
                    Pour chaque créneau horaire, on calcule la position du
                    soleil (azimut + hauteur) depuis un point de référence fixe
                    au centre de Paris. Ces coordonnées permettent de simuler la
                    direction des rayons.
                  </span>
                </li>
                <li>
                  <span className="font-medium">
                    Simulation d&apos;ombre par raytracing
                  </span>
                  <br />
                  <span className="text-slate-600">Pour chaque terrasse :</span>
                  <ul className="list-disc pl-6 text-slate-600 text-base mt-1 space-y-1">
                    <li>
                      On estime son altitude via le MNS, en prenant la valeur
                      minimale dans une petite zone autour du point (pour
                      corriger les imprécisions de placement).
                    </li>
                    <li>
                      À chaque horaire, un rayon solaire est projeté selon
                      l&apos;angle d&apos;incidence.
                    </li>
                    <li>
                      Tous les mètres, on compare la hauteur du rayon avec celle
                      du sol. Si un obstacle est détecté (bâtiment, arbre,
                      etc.), la terrasse est à l&apos;ombre.
                    </li>
                  </ul>
                </li>
                <li>
                  <span className="font-medium">Filtrage météo (nuages)</span>
                  <br />
                  <span className="text-slate-600">
                    Même si le rayon passe, on regarde aussi la couverture
                    nuageuse au moment donné. Si c&apos;est trop couvert
                    (au-delà d&apos;un certain seuil), la terrasse est marquée
                    comme &quot;sans soleil&quot;.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MethodologyModal;
