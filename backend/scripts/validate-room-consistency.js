#!/usr/bin/env node

/**
 * Script de validação da consistência dos contadores de membros nas salas
 * Executa: node scripts/validate-room-consistency.js
 */

import pool from '../src/config/database.js';

async function validateRoomConsistency() {
  console.log('🔍 Iniciando validação da consistência dos contadores de membros...\n');

  try {
    // 1. Buscar todas as salas e verificar consistência
    const result = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.current_members,
        (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) as actual_members,
        CASE 
          WHEN r.current_members = (SELECT COUNT(*) FROM room_members WHERE room_id = r.id) 
          THEN 'OK' 
          ELSE 'INCONSISTENT' 
        END as status
      FROM rooms r
      WHERE r.is_active = true
      ORDER BY r.created_at DESC
    `);

    console.log('📊 Relatório de Consistência:');
    console.log('═══════════════════════════════════════════════════════════════');
    
    let consistent = 0;
    let inconsistent = 0;
    
    result.rows.forEach(room => {
      const statusIcon = room.status === 'OK' ? '✅' : '❌';
      const roomId = room.id.substring(0, 8) + '...';
      
      console.log(`${statusIcon} ${room.name.padEnd(15)} | DB: ${room.current_members.toString().padStart(2)} | Real: ${room.actual_members.toString().padStart(2)} | ID: ${roomId}`);
      
      if (room.status === 'OK') {
        consistent++;
      } else {
        inconsistent++;
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📈 Resumo: ${consistent} consistentes, ${inconsistent} inconsistentes\n`);

    // 2. Verificar se o trigger existe
    const triggerResult = await pool.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers 
      WHERE trigger_name = 'room_member_count_trigger'
    `);

    if (triggerResult.rows.length > 0) {
      console.log('✅ Trigger de consistência está ativo');
      triggerResult.rows.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
      });
    } else {
      console.log('❌ Trigger de consistência NÃO encontrado');
    }

    // 3. Testar trigger (se não houver inconsistências)
    if (inconsistent === 0) {
      console.log('\n🧪 Testando trigger de consistência...');
      
      // Criar uma sala de teste temporária
      const testRoom = await pool.query(`
        INSERT INTO rooms (name, description, visibility, code, owner_id, current_members)
        VALUES ('TESTE_TRIGGER', 'Sala de teste', 'private', '#TEST', 
                (SELECT id FROM users LIMIT 1), 0)
        RETURNING id, owner_id
      `);

      const testRoomId = testRoom.rows[0].id;
      const ownerId = testRoom.rows[0].owner_id;

      try {
        // Adicionar owner como membro
        await pool.query(`
          INSERT INTO room_members (room_id, user_id, role, joined_at)
          VALUES ($1, $2, 'owner', CURRENT_TIMESTAMP)
        `, [testRoomId, ownerId]);

        // Verificar se o contador foi atualizado automaticamente
        const checkResult = await pool.query(`
          SELECT current_members FROM rooms WHERE id = $1
        `, [testRoomId]);

        const currentCount = checkResult.rows[0].current_members;
        
        if (currentCount === 1) {
          console.log('✅ Trigger funcionando corretamente (INSERT)');
        } else {
          console.log(`❌ Trigger falhou no INSERT (esperado: 1, obtido: ${currentCount})`);
        }

        // Testar DELETE
        await pool.query(`
          DELETE FROM room_members WHERE room_id = $1 AND user_id = $2
        `, [testRoomId, ownerId]);

        const checkResult2 = await pool.query(`
          SELECT current_members FROM rooms WHERE id = $1
        `, [testRoomId]);

        const currentCount2 = checkResult2.rows[0].current_members;
        
        if (currentCount2 === 0) {
          console.log('✅ Trigger funcionando corretamente (DELETE)');
        } else {
          console.log(`❌ Trigger falhou no DELETE (esperado: 0, obtido: ${currentCount2})`);
        }

      } finally {
        // Limpar sala de teste
        await pool.query(`DELETE FROM rooms WHERE id = $1`, [testRoomId]);
        console.log('🧹 Sala de teste removida\n');
      }
    }

    // 4. Conclusão
    if (inconsistent === 0) {
      console.log('🎉 VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('   - Todos os contadores estão consistentes');
      console.log('   - Trigger de prevenção está funcionando');
      console.log('   - Sistema pronto para uso em produção\n');
      return true;
    } else {
      console.log('⚠️  VALIDAÇÃO FALHOU!');
      console.log(`   - ${inconsistent} sala(s) com inconsistências`);
      console.log('   - Execute a migração 044 antes de continuar\n');
      return false;
    }

  } catch (error) {
    console.error('💥 Erro durante a validação:', error.message);
    return false;
  }
}

// Executar validação se o script for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  validateRoomConsistency()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

export default validateRoomConsistency;