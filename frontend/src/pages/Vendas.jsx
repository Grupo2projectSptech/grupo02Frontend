import { useState, useEffect } from 'react';
import { validators } from '../utils/validators';
import { fornecedorService } from '../services/api';
import Topbar from '../components/layout/Topbar';


function Vendas() {
    

    return(
        <div>
            <Topbar 
                title="Vendas"
                subtitle={`...`}
            />

            <div className ="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div className="search-wrap">
                        <svg className="search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input className="search-input" placeholder="Buscar Venda" />
                    </div>
                </div>

                <div className="table-wrap">
                    <table>
                    <thead><tr>
                    <th>Data</th>	<th>Venda</th>	<th>Tipo</th>	<th>Produto</th>	<th>Quatidade</th> <th>$ Custo Unuidade</th>	<th>$ Custo Total</th>	<th>$ Venda</th>	<th>Id Pedido</th>	<th>$ Motoboy</th>	<th>$ Frete Flex</th>	<th>$ Frete Diferença</th>	<th>$ Frete</th>	<th>Tarifa</th>	<th>% Imposto</th>	<th>$ Imposto</th>	<th>Operacional</th>	<th>$ Custo</th>	<th>$ Custo Total</th>	<th>% Margem</th>	<th>$ Margem</th>
                    </tr></thead>

                    <tbody>
                        
                    </tbody>
                    </table>
                </div>
                

            </div>

        </div>
    );
}

export default Vendas;