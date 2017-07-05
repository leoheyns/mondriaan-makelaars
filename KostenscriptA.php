<?php 
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
// mysql_select_db("firstchoice",$mysql) or die("Fout: Het openen van de database is mislukt!");
//$resultaat = mysql_query("SELECT `PandID` FROM panden",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");
?>
<form action="KostenscriptB.php" method="post">
maximale kosten<br />
<input type="text" name="KostenMax" maxlength="6" /><br />
minimale kosten:<br />
<input type="text" name="KostenMin" maxlength="6" /><br />
<input type="submit" value="Verzend" />
</form>
