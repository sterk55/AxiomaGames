import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

export default function Clasificacion() {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data, error } = await supabase
      .from("resultados")
      .select("*")
      .order("puntuacion", { ascending: false });

    if (!error) setData(data);
  }

  return (
    <div className="container">
      <h1>🏆 Clasificación</h1>

      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", color: "white" }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Puntos</th>
              <th>Nivel</th>
              <th>Aciertos</th>
              <th>Precisión</th>
              <th>Tiempo</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td>{row.nombre}</td>
                <td>{row.puntuacion}</td>
                <td>{row.nivel}</td>
                <td>{row.aciertos}</td>
                <td>{row.precision}%</td>
                <td>{row.tiempo_promedio}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}